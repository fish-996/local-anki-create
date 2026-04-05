import { Link, LinkProps } from '@mui/material'
import ClientLink from './ClientLink'
import { LinkProps as NextLinkProps } from 'next/link'

export type UiLinkProps = Omit<LinkProps, 'href' | 'component'> & {
    href: NextLinkProps['href']
}

export const UiLink = ({ href, ...props }: UiLinkProps) => (
    <Link component={ClientLink} href={href} {...props} />
)
