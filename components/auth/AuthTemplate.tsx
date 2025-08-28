import Image from 'next/image';

const AuthTemplate = ({
    children
}: Readonly<{
    children: React.ReactNode;
}>) => {
    return (
        <div className="flex min-h-screen w-full flex-wrap items-stretch bg-white dark:bg-gray-800 max-md:pb-20 md:pt-0 pt-20">
            <div className="grow md:flex md:w-1/2 md:flex-col md:items-center md:justify-center md:py-20">
                <div className="w-full px-4 text-center text-xs lg:w-1/2">
                    <Image
                        src="/images/logo/logo.png"
                        alt="Nudgely"
                        width={200}
                        height={100}
                        className="visible md:hidden mb-7 mx-auto"
                    />
                    {children}
                </div>
            </div>

            <div className="hidden flex-col justify-center overflow-hidden bg-cover bg-center md:flex md:w-1/2 bg-[url('/images/backgrounds/authbg.jpg')]">
                <Image
                    src="/images/logo/logo.png"
                    alt="Nudgely"
                    className="p-10 translate-x-[30%] rounded-[36px] shadow-[0_24px_88px_rgba(0,0,0,0.55)]"
                    width={600}
                    height={100}
                />
            </div>
        </div>
    );
};
export default AuthTemplate;
