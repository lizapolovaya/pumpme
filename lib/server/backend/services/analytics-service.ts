import type { AnalyticsService } from './contracts';
import type { OpenAiConfig } from '../config';
import type { AnalyticsRepository } from '../repositories/contracts';
import type {
    ProgressCoachDto,
    ProgressLiftSummaryDto,
    ProgressMetricsSummaryDto,
    ProgressPointDto,
    ProgressSummaryDto
} from '../types';

const OPENAI_PROGRESS_COACH_MODEL = 'gpt-5.5';

type OpenAiResponsesApiResponse = {
    output?: Array<{
        content?: Array<{
            text?: string;
            type?: string;
        }>;
        type?: string;
    }>;
    output_text?: string;
};

function roundToNearest(value: number, step: number): number {
    return Math.round(value / step) * step;
}

function formatLoadTargets(currentEstimatedOneRmKg: number): string {
    if (currentEstimatedOneRmKg <= 0) {
        return 'no load targets yet';
    }

    const targets = [0.8, 0.85, 0.9].map((percent) => roundToNearest(currentEstimatedOneRmKg * percent, 2.5));
    return targets
        .map((target) => `${target % 1 === 0 ? target.toFixed(0) : target.toFixed(1)} kg`)
        .join(', ');
}

function getSelectedLift(summary: ProgressMetricsSummaryDto): ProgressLiftSummaryDto | null {
    if (!summary.liftSummaries.length) {
        return null;
    }

    return (
        summary.liftSummaries.find((lift) => lift.exerciseId === summary.selectedLiftId) ??
        summary.liftSummaries[0] ??
        null
    );
}

function getCoachHeadline(volumeTrend: ProgressPointDto[], selectedLift: ProgressLiftSummaryDto | null): string {
    const latestVolume = volumeTrend.at(-1)?.value ?? 0;
    const previousVolume = volumeTrend.at(-2)?.value ?? 0;
    const liftName = selectedLift?.exerciseName ?? 'Primary lift';

    if (!selectedLift) {
        return 'Strength trend is building.';
    }

    if (latestVolume > previousVolume) {
        return `${liftName} momentum is building.`;
    }

    if (latestVolume < previousVolume) {
        return `${liftName} progress is flattening.`;
    }

    return `${liftName} is holding steady.`;
}

function getCoachSummary(
    volumeTrend: ProgressPointDto[],
    selectedLift: ProgressLiftSummaryDto | null,
    recoveryScore: number
): string {
    const latestVolume = volumeTrend.at(-1)?.value ?? 0;
    const previousVolume = volumeTrend.at(-2)?.value ?? 0;
    const volumeDelta = previousVolume > 0 ? Math.round(((latestVolume - previousVolume) / previousVolume) * 100) : 0;
    const peakOneRm = selectedLift?.currentEstimatedOneRmKg ?? 0;
    const liftName = selectedLift?.exerciseName ?? 'Your main lift';
    const recoveryStatus = recoveryScore >= 85 ? 'High Readiness' : 'Monitor Recovery';

    if (peakOneRm <= 0) {
        return `${liftName} needs more logged sets before next-load targets can be shown.`;
    }

    const loadTargets = formatLoadTargets(peakOneRm);

    if (latestVolume > previousVolume) {
        return `${liftName} is at ${peakOneRm} kg. Weekly volume is up ${volumeDelta}%, ${recoveryStatus}, and next load targets are ${loadTargets}.`;
    }

    if (latestVolume < previousVolume) {
        return `${liftName} is holding near ${peakOneRm} kg. Volume dipped this window, ${recoveryStatus}, so keep the next work set in the ${loadTargets} range.`;
    }

    return `${liftName} is stable at ${peakOneRm} kg. ${recoveryStatus}, so hold intensity steady and aim for ${loadTargets} next session.`;
}

function buildHeuristicCoach(summary: ProgressMetricsSummaryDto): ProgressCoachDto {
    const selectedLift = getSelectedLift(summary);
    return {
        headline: getCoachHeadline(summary.volumeTrend, selectedLift),
        model: null,
        source: 'heuristic',
        summary: getCoachSummary(summary.volumeTrend, selectedLift, summary.recoveryScore)
    };
}

function extractResponseText(payload: OpenAiResponsesApiResponse): string {
    if (typeof payload.output_text === 'string' && payload.output_text.trim().length > 0) {
        return payload.output_text.trim();
    }

    const parts =
        payload.output
            ?.flatMap((item) => item.content ?? [])
            .map((item) => item.text?.trim() ?? '')
            .filter((text) => text.length > 0) ?? [];

    return parts.join('\n').trim();
}

function normalizeJsonText(rawText: string): string {
    const trimmed = rawText.trim();

    if (trimmed.startsWith('```')) {
        return trimmed.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
    }

    return trimmed;
}

function parseCoachResponse(rawText: string): Pick<ProgressCoachDto, 'headline' | 'summary'> | null {
    try {
        const parsed = JSON.parse(normalizeJsonText(rawText)) as { headline?: unknown; summary?: unknown };
        if (typeof parsed.headline !== 'string' || typeof parsed.summary !== 'string') {
            return null;
        }

        const headline = parsed.headline.trim();
        const summary = parsed.summary.trim();

        if (!headline || !summary) {
            return null;
        }

        return { headline, summary };
    } catch {
        return null;
    }
}

export class DefaultAnalyticsService implements AnalyticsService {
    constructor(
        private readonly userId: string,
        private readonly repository: AnalyticsRepository,
        private readonly openAiConfig: OpenAiConfig
    ) {}

    async getProgress(range: string) {
        const summary = await this.repository.getProgressSummary(this.userId, range);
        const heuristicCoach = buildHeuristicCoach(summary);
        const coach = await this.generateCoach(summary, heuristicCoach);

        return {
            ...summary,
            coach
        };
    }

    private async generateCoach(summary: ProgressMetricsSummaryDto, heuristicCoach: ProgressCoachDto): Promise<ProgressCoachDto> {
        if (!this.openAiConfig.apiKey) {
            return heuristicCoach;
        }

        try {
            const response = await fetch(`${this.openAiConfig.baseUrl}/responses`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${this.openAiConfig.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    input: [
                        {
                            role: 'system',
                            content: [
                                {
                                    type: 'input_text',
                                    text: [
                                        'You are a concise strength training coach.',
                                        'Return JSON only with keys "headline" and "summary".',
                                        'The headline must be 2 to 6 words.',
                                        'The summary must be at most 220 characters.',
                                        'Base the answer only on the provided metrics.',
                                        'Avoid medical advice and avoid mentioning missing data.'
                                    ].join(' ')
                                }
                            ]
                        },
                        {
                            role: 'user',
                            content: [
                                {
                                    type: 'input_text',
                                    text: JSON.stringify({
                                        averageRpe: summary.averageRpe,
                                        selectedLift: summary.liftSummaries.find((lift) => lift.exerciseId === summary.selectedLiftId) ?? null,
                                        oneRmTrend: summary.oneRmTrend,
                                        range: summary.range,
                                        recoveryScore: summary.recoveryScore,
                                        volumeTrend: summary.volumeTrend
                                    })
                                }
                            ]
                        }
                    ],
                    max_output_tokens: 180,
                    model: OPENAI_PROGRESS_COACH_MODEL,
                    reasoning: {
                        effort: 'medium'
                    }
                })
            });

            if (!response.ok) {
                return heuristicCoach;
            }

            const payload = (await response.json()) as OpenAiResponsesApiResponse;
            const parsedCoach = parseCoachResponse(extractResponseText(payload));

            if (!parsedCoach) {
                return heuristicCoach;
            }

            return {
                ...parsedCoach,
                model: OPENAI_PROGRESS_COACH_MODEL,
                source: 'openai'
            };
        } catch {
            return heuristicCoach;
        }
    }
}
