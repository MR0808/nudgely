import { Eye } from 'lucide-react';

const RegisterForm = () => {
    return (
        <>
            <h1 className="mb-8 text-2xl font-bold text-gray-800 dark:text-white">
                Welcome Back
            </h1>
            <p className="mb-6 text-gray-600 dark:text-gray-400">
                Access your account to explore our amazing features.
            </p>
            <form className="flex flex-col gap-6">
                <input id="plan" type="hidden" value="" name="plan" />

                <div className="relative">
                    <label className="flex cursor-pointer items-center gap-2 text-xs font-medium leading-none text-gray-700 dark:text-gray-200 mb-3">
                        <span className="">Email Address</span>
                    </label>
                    <input
                        className="block peer w-full px-4 py-3 border border-gray-300 bg-gray-100 text-gray-800 placeholder-gray-500 dark:bg-gray-700 dark:text-white dark:border-gray-600 placeholder-gray-400 transition-colors focus:border-indigo-500 focus:outline-0 focus:ring focus:ring-indigo-200 dark:focus:ring-indigo-500"
                        type="email"
                        placeholder="you@example.com"
                    />
                </div>

                <div className="relative">
                    <label className="flex cursor-pointer items-center gap-2 text-xs font-medium leading-none text-gray-700 dark:text-gray-200 mb-3">
                        <span className="">Password</span>
                    </label>
                    <div className="relative">
                        <input
                            className="block peer w-full px-4 py-3 border border-gray-300 bg-gray-100 text-gray-800 placeholder-gray-500 dark:bg-gray-700 dark:text-white dark:border-gray-600 placeholder-gray-400 transition-colors focus:border-indigo-500 focus:outline-0 focus:ring focus:ring-indigo-200 dark:focus:ring-indigo-500"
                            placeholder="Your password"
                        />
                        <button
                            className="lqd-show-password absolute right-3 top-1/2 z-10 inline-flex -translate-y-1/2 cursor-pointer items-center justify-center rounded transition-colors hover:bg-gray-200 dark:hover:bg-gray-600"
                            type="button"
                        >
                            <Eye className="w-5" />
                        </button>
                    </div>
                </div>

                <div className="my-2 flex justify-between gap-2">
                    <div className="grow">
                        <div className="relative">
                            <label className="flex cursor-pointer items-center gap-2 text-xs font-medium leading-none text-gray-700 dark:text-gray-200">
                                <input
                                    id="remember"
                                    className="peer rounded border-gray-300 dark:border-gray-600 focus:ring focus:ring-indigo-200 dark:focus:ring-indigo-500"
                                    name="remember"
                                    type="checkbox"
                                />
                                <span className="">Remember me</span>
                            </label>
                        </div>
                    </div>
                    <div className="text-right">
                        <a
                            className="text-indigo-600 dark:text-indigo-400"
                            href="/forgot-password"
                        >
                            Forgot Password?
                        </a>
                    </div>
                </div>

                <button
                    className="lqd-btn group inline-flex items-center justify-center gap-1.5 font-medium rounded-full transition-all hover:-translate-y-0.5 hover:shadow-xl lqd-btn-primary bg-indigo-600 text-white hover:bg-indigo-500 focus-visible:bg-indigo-700 focus-visible:shadow-indigo-300/10 px-5 py-3"
                    id="LoginFormButton"
                    type="submit"
                >
                    Sign in
                </button>
                <div className="text-gray-600 dark:text-gray-400">
                    By proceeding, you acknowledge and accept our
                    <a
                        className="font-medium text-indigo-600 underline"
                        href="/terms"
                        target="_blank"
                    >
                        Terms and Conditions
                    </a>
                    and
                    <a
                        className="font-medium text-indigo-600 underline"
                        href="/privacy-policy"
                        target="_blank"
                    >
                        Privacy Policy
                    </a>
                    .
                </div>
            </form>
            <div className="mt-20 text-gray-600 dark:text-gray-400">
                Don&apos;t have an account yet?
                <a
                    className="font-medium text-indigo-600 underline"
                    href="/register"
                >
                    Sign up
                </a>
            </div>
        </>
    );
};

export default RegisterForm;
