import * as React from "react";
import {Html, Body, Container, Heading, Text, Section, Link, Hr, Img} from "@react-email/components";

interface WelcomeUserEmailProps {
    username: string;
    password: string;
    role: string;
    createdBy: string;
    createdAt: string;
    websiteUrl?: string;
}

export const WelcomeUserEmail = ({
                                     username,
                                     password,
                                     role,
                                     createdBy,
                                     createdAt,
                                     websiteUrl,
                                 }: WelcomeUserEmailProps) => {
    return (
        <Html>
            {/* Icon */}
            <Section className="text-center mb-6">
                <Img
                    srcSet={`${websiteUrl}/favicon.ico`}
                    width="64"
                    height="64"
                    alt="Welcome"
                    className="mx-auto"
                />
            </Section>

            <Body className="bg-gradient-to-br from-slate-50 to-blue-50 font-sans p-4 sm:p-6">
                <Container className="bg-white rounded-2xl shadow-xl max-w-xl mx-auto overflow-hidden border border-gray-100">

                    {/* Header */}
                    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-10 text-center">
                        <Section className="bg-gradient-to-r from-blue-600 to-indigo-700 p-8 text-center">
                            <Heading className="text-3xl font-bold text-white mb-2">
                                👋 Welcome Aboard!
                            </Heading>
                            <Text className="text-blue-100 text-lg">
                                Your Maintenance Knowledge Base Account is Ready
                            </Text>
                        </Section>
                    </div>

                    {/* Main Content */}
                    <div className="px-8 py-10">
                        <Text className="text-gray-800 text-lg mb-4">
                            Hello <span className="font-semibold text-gray-900">{username}</span>,
                        </Text>

                        <Text className="text-gray-600 mb-8 leading-relaxed">
                            You're now part of our Maintenance Knowledge Base platform. Your account details are below:
                        </Text>

                        {/* Account Details */}
                        <div className="mb-12">
                            <Heading className="text-xl font-bold text-gray-900 mb-6">
                                🔐 Account Information
                            </Heading>

                            <table className="w-full border border-gray-200 rounded-xl overflow-hidden">
                                <tbody>

                                {/* Username */}
                                <tr className="bg-white border-b">
                                    <td className="px-6 py-4 text-sm font-semibold text-gray-600 w-1/3">
                                        Username
                                    </td>
                                    <td className="px-6 py-4">
                                      <span className="block text-gray-900 font-semibold text-base">
                                        {username}
                                      </span>
                                    </td>
                                </tr>

                                {/* Password */}
                                <tr className="bg-gray-50 border-b">
                                    <td className="px-6 py-4 text-sm font-semibold text-gray-600">
                                        Password
                                    </td>
                                    <td className="px-6 py-4">
                                      <span className="inline-block bg-red-50 text-red-700 font-mono font-semibold px-4 py-2 rounded-lg tracking-wide">
                                        {password}
                                      </span>
                                    </td>
                                </tr>

                                {/* Role */}
                                <tr className="bg-white border-b">
                                    <td className="px-6 py-4 text-sm font-semibold text-gray-600">
                                        Role
                                    </td>
                                    <td className="px-6 py-4">
                                      <span className="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-semibold bg-indigo-100 text-indigo-800">
                                        {role}
                                      </span>
                                    </td>
                                </tr>

                                {/* Created By */}
                                <tr className="bg-gray-50 border-b">
                                    <td className="px-6 py-4 text-sm font-semibold text-gray-600">
                                        Created By
                                    </td>
                                    <td className="px-6 py-4 text-gray-900 font-medium">
                                        {createdBy}
                                    </td>
                                </tr>

                                {/* Created At */}
                                <tr className="bg-white">
                                    <td className="px-6 py-4 text-sm font-semibold text-gray-600">
                                        Created On
                                    </td>
                                    <td className="px-6 py-4 text-gray-900 font-medium">
                                        {createdAt}
                                    </td>
                                </tr>

                                </tbody>
                            </table>
                        </div>

                        {websiteUrl && <Text className="text-center text-gray-500 text-sm mb-10">
                            visit : <Link
                            href={websiteUrl}
                            className="inline-block bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold text-lg py-4 px-10 rounded-xl hover:shadow-lg hover:shadow-indigo-200 transition-all duration-200 hover:scale-[1.02]"
                        >
                            Access Your Dashboard
                        </Link>
                        </Text>}

                        <Hr className="border-gray-200 my-10" />

                        {/* Important Notes */}
                        <div className="mb-8">
                            <Heading className="text-xl font-bold text-gray-900 mb-5">
                                🚀 Getting Started
                            </Heading>
                            <ul className="space-y-3">
                                {/*<li className="flex items-start">*/}
                                {/*    <div className="flex-shrink-0 h-6 w-6 rounded-full bg-indigo-100 flex items-center justify-center mr-3 mt-0.5">*/}
                                {/*        <div className="h-3 w-3 rounded-full bg-indigo-600"></div>*/}
                                {/*    </div>*/}
                                {/*    <span className="text-gray-700">Change your password after first login for security</span>*/}
                                {/*</li>*/}
                                <li className="flex items-start">
                                    <div className="flex-shrink-0 h-6 w-6 rounded-full bg-indigo-100 flex items-center justify-center mr-3 mt-0.5">
                                        <div className="h-3 w-3 rounded-full bg-indigo-600"></div>
                                    </div>
                                    <span className="text-gray-700">Bookmark the login page for quick access</span>
                                </li>
                                <li className="flex items-start">
                                    <div className="flex-shrink-0 h-6 w-6 rounded-full bg-indigo-100 flex items-center justify-center mr-3 mt-0.5">
                                        <div className="h-3 w-3 rounded-full bg-indigo-600"></div>
                                    </div>
                                    <span className="text-gray-700">Your role determines available features and permissions</span>
                                </li>
                                <li className="flex items-start">
                                    <div className="flex-shrink-0 h-6 w-6 rounded-full bg-indigo-100 flex items-center justify-center mr-3 mt-0.5">
                                        <div className="h-3 w-3 rounded-full bg-indigo-600"></div>
                                    </div>
                                    <span className="text-gray-700">Contact support if you encounter any issues</span>
                                </li>
                            </ul>
                        </div>

                        {/* Footer */}
                        <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-8 text-center border border-gray-200">
                            <Text className="text-gray-700 text-base mb-4 leading-relaxed">
                                We're excited to have you on board! If you have any questions,
                                please contact your system administrator.
                            </Text>
                            <Text className="text-gray-500 text-sm">
                                This is an automated message. Please do not reply to this email.
                            </Text>
                        </div>
                    </div>
                </Container>
            </Body>
        </Html>
    );
};

export default WelcomeUserEmail;