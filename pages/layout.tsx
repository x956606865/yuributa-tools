import { AppShell, Group, Navbar, Text, ThemeIcon, UnstyledButton } from '@mantine/core';
import { IconAspectRatio } from '@tabler/icons';
import { IconCrop } from '@tabler/icons-react';

import { useRouter } from 'next/router';
import type { ReactNode } from 'react';

interface MainLinkProps {
  icon: React.ReactNode;
  color: string;
  label: string;
  href: string;
}
function MainLink({ icon, color, label, href }: MainLinkProps) {
  const router = useRouter();
  return (
    <UnstyledButton
      sx={(theme) => ({
        display: 'block',
        width: '100%',
        padding: theme.spacing.xs,
        borderRadius: theme.radius.sm,
        color: theme.colorScheme === 'dark' ? theme.colors.dark[0] : theme.black,

        '&:hover': {
          backgroundColor:
            theme.colorScheme === 'dark' ? theme.colors.dark[6] : theme.colors.gray[0],
        },
      })}
      onClick={() => {
        router.push(href);
      }}
    >
      <Group>
        <ThemeIcon color={color} variant="light">
          {icon}
        </ThemeIcon>

        <Text size="sm">{label}</Text>
      </Group>
    </UnstyledButton>
  );
}

const data = [
  {
    icon: <IconCrop size="1rem" />,
    color: 'blue',
    label: '漫画打包',
    href: '/mangaCrop/MangaCrop',
  },
  {
    icon: <IconAspectRatio size="1rem" />,
    color: 'blue',
    label: 'notion漫画',
    href: '/notion',
  },
];

export default function Layout({ children }: { children: ReactNode }) {
  const links = data.map((link) => <MainLink {...link} key={link.label} />);

  //   console.log('%c [ theme ]-7', 'font-size:13px; background:pink; color:#bf2c9f;', theme);
  return (
    <AppShell
      padding="md"
      navbar={
        <Navbar hiddenBreakpoint={10000} width={{ base: 300 }} height="100%" p="xs">
          <Navbar.Section grow mt="md">
            {links}
          </Navbar.Section>
        </Navbar>
      }
      // header={<YuriHeader />}
      styles={(theme) => ({
        main: {
          backgroundColor:
            theme.colorScheme === 'dark' ? theme.colors.dark[8] : theme.colors.gray[0],
        },
      })}
    >
      {/* Your application here */}
      {children}
    </AppShell>
  );
}
