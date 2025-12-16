import * as React from "react";
import { Html, Body, Container, Heading, Text, Section } from "@react-email/components";

interface NewPasswordEmailProps {
    name: string;
    newPassword: string;
}

export const NewPasswordEmail = ({ name, newPassword }: NewPasswordEmailProps) => {
    return (
        <Html>
            <Body style={{ backgroundColor: "#f4f4f4", fontFamily: "Arial, sans-serif" }}>
                <Container style={{ background: "#fff", padding: "24px", borderRadius: "8px" }}>

                    <Heading style={{ color: "#333", fontSize: "22px" }}>
                        Your New Password
                    </Heading>

                    <Text style={{ fontSize: "15px", color: "#555" }}>
                        Hi <strong>{name}</strong>,
                    </Text>

                    <Text style={{ fontSize: "15px", color: "#555" }}>
                        A new password has been automatically generated for your account.
                    </Text>

                    <Section
                        style={{
                            marginTop: "18px",
                            background: "#efefef",
                            padding: "14px",
                            borderRadius: "6px",
                            textAlign: "center",
                        }}
                    >
                        <Text style={{ fontSize: "26px", fontWeight: "bold", letterSpacing: "2px" }}>
                            {newPassword}
                        </Text>
                    </Section>

                </Container>
            </Body>
        </Html>
    );
};

export default NewPasswordEmail;
