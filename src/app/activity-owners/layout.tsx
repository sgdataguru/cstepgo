'use client';

import React from 'react';
import ProviderLayout from './components/shared/ProviderLayout';

export default function ActivityOwnersRootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <ProviderLayout>{children}</ProviderLayout>;
}
