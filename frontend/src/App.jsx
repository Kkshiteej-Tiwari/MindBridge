import { motion } from "framer-motion";

export default function App() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-navy via-violet to-teal text-lavender">
      <section className="mx-auto flex max-w-5xl flex-col items-center gap-6 px-6 py-24 text-center">
        <motion.h1
          className="text-4xl font-bold tracking-tight md:text-6xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          MindBridge AI
        </motion.h1>
        <motion.p
          className="max-w-2xl text-lg text-lavender/90"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
        >
          Frontend initialized with React, TailwindCSS, Framer Motion, Redux Toolkit,
          React Query, D3.js, Recharts, Three.js, and Socket.IO client.
        </motion.p>
      </section>
    </main>
  );
}
