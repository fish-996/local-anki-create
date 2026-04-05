'use client';
import { useRouter } from 'next/navigation';
import { IconButton } from '@mui/material';
import { RefreshOutlined } from '@mui/icons-material';

export const RefreshIcon = () => {

    const router = useRouter();
    const handleRefresh = () => {
        router.refresh();
    };

    return (
        <IconButton onClick={handleRefresh}>
            <RefreshOutlined />
        </IconButton>
    );
};
