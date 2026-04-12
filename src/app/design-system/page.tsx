"use client";

import React from "react";
import { Navbar } from "@/components/ui/Navbar";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { CodeBlock } from "@/components/ui/CodeBlock";
import { motion } from "framer-motion";

export default function DesignSystemPage() {
  return (
    <div className="min-h-screen bg-[color:var(--bg)] text-[color:var(--text)] font-sans">
      <Navbar>
        <Button variant="outline" size="sm" onClick={() => alert('Logged in!')}>
          Login
        </Button>
      </Navbar>

      <main className="pt-24 pb-16 px-6 max-w-4xl mx-auto space-y-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-4"
        >
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">AI Design System</h1>
          <p className="text-[color:var(--muted)] text-lg max-w-2xl">
            A comprehensive, accessible, and themeable UI library inspired by Anthropic and OpenAI. 
            Designed for building next-generation AI interfaces.
          </p>
        </motion.div>

        {/* Typography */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold border-b border-[color:var(--border)] pb-2">Typography</h2>
          <div className="space-y-4">
            <h1 className="text-4xl font-bold">Heading 1</h1>
            <h2 className="text-3xl font-semibold">Heading 2</h2>
            <h3 className="text-2xl font-medium">Heading 3</h3>
            <p className="text-base text-[color:var(--muted)]">
              This is a paragraph of text. It uses the muted color variable to provide high contrast while 
              reducing eye strain. The font stack defaults to system-ui for optimal performance and legibility.
            </p>
          </div>
        </section>

        {/* Buttons */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold border-b border-[color:var(--border)] pb-2">Buttons</h2>
          <div className="flex flex-wrap gap-4 items-center">
            <Button variant="default">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="default" disabled>Disabled</Button>
          </div>
        </section>

        {/* Inputs */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold border-b border-[color:var(--border)] pb-2">Forms</h2>
          <div className="max-w-sm space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-sm font-medium">Email address</label>
              <Input id="email" type="email" placeholder="name@example.com" />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="password" className="text-sm font-medium">Password</label>
              <Input id="password" type="password" placeholder="••••••••" />
            </div>
            <Button className="w-full">Sign In</Button>
          </div>
        </section>

        {/* Cards */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold border-b border-[color:var(--border)] pb-2">Cards</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Anthropic Claude</CardTitle>
                <CardDescription>Next-generation AI assistant</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-[color:var(--muted)]">
                  Claude is a family of foundational AI models that can be used in a variety of applications.
                </p>
              </CardContent>
              <CardFooter>
                <Button variant="secondary" className="w-full">Read Paper</Button>
              </CardFooter>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>OpenAI GPT-4</CardTitle>
                <CardDescription>Advanced reasoning capabilities</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-[color:var(--muted)]">
                  GPT-4 is a large multimodal model (accepting image and text inputs, emitting text outputs).
                </p>
              </CardContent>
              <CardFooter>
                <Button variant="secondary" className="w-full">Try ChatGPT</Button>
              </CardFooter>
            </Card>
          </div>
        </section>

        {/* Code Blocks */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold border-b border-[color:var(--border)] pb-2">Code Block</h2>
          <CodeBlock
            language="typescript"
            code={`import { Anthropic } from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

async function main() {
  const msg = await anthropic.messages.create({
    model: "claude-3-opus-20240229",
    max_tokens: 1000,
    temperature: 0,
    system: "Respond only in JSON.",
    messages: [
      { "role": "user", "content": "Extract the names." }
    ]
  });
  console.log(msg);
}`}
          />
        </section>
      </main>
    </div>
  );
}
