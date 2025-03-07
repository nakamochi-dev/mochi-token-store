import { type FC } from "react";
import { APP_DESCRIPTION, APP_NAME } from "~/constants";
import Image from "next/image";
import Link from "next/link";
import Logo from "~/components/Logo";
import { useTheme } from "next-themes";

export const Footer: FC = () => {
  const { theme } = useTheme();
  const links = [
    {
      label: "About Smart Wallet",
      href: "https://www.smartwallet.dev?utm_source=basetokenstore",
    },
    // UNCOMMENT THIS TO SHOW THE AD LINk
    // {
    //   label: "Buy an Ad",
    //   href: "/advertisement/create",
    // },
    {
      label: "Build on Base",
      href: "https://www.base.org?utm_source=basetokenstore",
    }
  ];

  type BuildersProps = { className?: string };
  const Builders: FC<BuildersProps> = ({ className }) => (
    <div className={className}>
      <div className="flex sm:flex-row flex-col items-center gap-4 mt-4">
        <Link href="https://x.com/mochi_token" className="flex items-center gap-1" target="_blank" rel="noreferrer">
          <Image src="https://mochithecatcoin.com/img/logo.png" alt="Mochi" className="h-6 w-6 rounded-full" width={24} height={24} />
          <span className="text-xs">Part of the MOCHI ecosystem.</span>
        </Link>
      </div>
    </div>
  );

  return (
    <div className="overflow-hidden mx-auto bg-neutral text-neutral-content min-h-96 relative">
      <div className="flex sm:flex-row flex-col gap-4 justify-between w-full p-20 max-w-7xl mx-auto mb-40">
        <div className="flex flex-col gap-4">
          <div className="w-full justify-start">
            <Logo
              shapesFill={`${theme === 'dark' ? '#C9CCD5' : '#FFFFFF'}`}
              backgroundFill={`${theme === 'dark' ? '#000000' : '#1E4FFD'}`}
              width={70}
              height={25}
            />
          </div>
          <div className="text-4xl tracking-tighter">{APP_NAME}</div>
          <div className="text-sm -mt-3">{APP_DESCRIPTION}</div>
          <Builders className="sm:flex hidden" />
        </div>
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-2 text-sm">
            {links.map((link) => (
              <Link key={link.href} href={link.href} target="_blank" rel="noreferrer">
                {link.label}
              </Link>
            ))}
          </div>
          <Builders className="sm:hidden flex" />
        </div>
      </div>
    </div>
  )
};

export default Footer;
