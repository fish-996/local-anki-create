'use client';

import { MenuItem, MenuItemProps } from '@mui/material';
import Link, { LinkProps as NextLinkProps } from 'next/link';
import { usePathname } from 'next/navigation';

export type ClientMenuItemProps = MenuItemProps<'a'> & NextLinkProps;

export const ClientMenuItem = ({
    href,
    children,
    ...props
}: ClientMenuItemProps) => {
    const path = usePathname();
    return (
        <MenuItem
            component={Link}
            href={href}
            {...props}
            selected={path === href}
        >
            {children}
        </MenuItem>
    );
};
