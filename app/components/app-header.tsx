import Link from 'next/link';
import { Bolt } from 'lucide-react';

export function AppHeader() {
  return (
    <header className="fixed inset-x-0 top-0 z-30 bg-background">
      <div className="mx-auto flex h-16 w-full max-w-md items-center justify-between bg-surface-container-low/80 px-6 backdrop-blur-md md:max-w-5xl">
        <div className="flex items-center gap-3">
          <Bolt className="h-5 w-5 text-primary-container" strokeWidth={2.2} />
          <h1 className="font-headline text-xl font-bold italic uppercase tracking-[-0.08em] text-primary-container">
            PumpMe
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/profile"
            className="h-10 w-10 overflow-hidden rounded-full border-2 border-primary-container/20 transition-transform duration-150 active:scale-95"
            aria-label="Open profile"
          >
            <img
              className="h-full w-full object-cover"
              alt="Profile avatar"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBXb6bQ_6pGK2QytE71viNJV7IVFABH_L7U4x8FcpFvOqHCQ9OxgKk1xBZQQZK-HGl_k1N_vfKdaaoc95JBGZXRfAO6x5Pa5XEUfuRV5jZCSAwxTZwt7h3SXMR9gpnY0sP_O5tKTUCnCqJyYBX9OVIUYHjWTTu1cfHJfQdUF6K70u1VYb720azdtT9BGxtdaIv3nUcw0kXZGwkWN0FCpwweKFzzvaC8MKFTwEI83Vt74SaRgemweAt0gDoBUwMHu2N__xU6IZLiEBnR"
            />
          </Link>
        </div>
      </div>
    </header>
  );
}
