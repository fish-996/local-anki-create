import { Drawer, MenuItem, MenuList } from '@mui/material'
import { ClientMenuItem } from '@/components/ClientMenuItem'

export const SideMenu = () => {
    return (
        <Drawer variant="permanent" style={{ width: '240px' }}>
            <MenuList style={{ width: '240px' }}>
                <ClientMenuItem href="/deck">卡组</ClientMenuItem>
                <ClientMenuItem href="/note">词条</ClientMenuItem>
                {/*<ClientMenuItem href="/card">卡片</ClientMenuItem>*/}
                <ClientMenuItem href="/prompt">提示词</ClientMenuItem>
                {/*<ClientMenuItem href="/setting">设置</ClientMenuItem>*/}
            </MenuList>
        </Drawer>
    )
}
