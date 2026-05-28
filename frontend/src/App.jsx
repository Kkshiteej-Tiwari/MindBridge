import { NavLink, Route, Routes } from "react-router-dom";
import { motion } from "framer-motion";
import { JournalPage } from "./features/journal/JournalPage";
import { OnboardingPage } from "./features/onboarding/OnboardingPage";
import { CoachPage } from "./features/coach/CoachPage";
import { CommunityPage } from "./features/community/CommunityPage";
import { ChallengesPage } from "./features/challenges/ChallengesPage";
import { ResourcesPage } from "./features/resources/ResourcesPage";
import { SOSPage } from "./features/sos/SOSPage";
import { StressPage } from "./features/stress/StressPage";


const navItems = [
	{ to: "/onboarding", label: "Onboard" },
	{ to: "/", label: "Journal" },
	{ to: "/voice", label: "Voice Journal" },
	{ to: "/coach", label: "Coach" },
	{ to: "/stress", label: "Stress" },
	{ to: "/community", label: "Community" },
	{ to: "/challenges", label: "Challenges" },
	{ to: "/resources", label: "Resources" },
	{ to: "/sos", label: "SOS Hub" },
];

function App() {
	return (
		<div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(46,196,182,0.18),_transparent_40%),radial-gradient(circle_at_20%_10%,_rgba(255,122,106,0.2),_transparent_35%),linear-gradient(180deg,_#f7f4ef_0%,_#f3f1ea_55%,_#e9f3ef_100%)] text-ink">
			<header className="sticky top-0 z-30 border-b border-ink/10 bg-white/70 backdrop-blur-xl">
				<div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4">
					<div>
						<p className="text-xs uppercase tracking-[0.35em] text-ink/50">MindBridge</p>
						<h1 className="font-display text-2xl font-semibold text-ink">Student Wellness Suite</h1>
					</div>
					<nav className="flex flex-wrap items-center gap-2">
						{navItems.map((item) => (
							<NavLink
								key={item.to}
								to={item.to}
								end={item.to === "/"}
								className={({ isActive }) =>
									`rounded-full px-4 py-2 text-sm font-semibold transition ${
										isActive
											? "bg-ink text-cream shadow-lg shadow-ink/20"
											: "bg-white/70 text-ink/70 hover:bg-white"
									}`
								}
							>
								{item.label}
							</NavLink>
						))}
					</nav>
				</div>
			</header>

			<motion.main
				initial={{ opacity: 0, y: 16 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.4 }}
				className="mx-auto w-full max-w-6xl px-4 pb-16 pt-6"
			>
				<Routes>
					<Route path="/onboarding" element={<OnboardingPage />} />
					<Route path="/" element={<JournalPage />} />
					<Route path="/voice" element={<JournalPage voiceMode />} />
					<Route path="/coach" element={<CoachPage />} />
					<Route path="/stress" element={<StressPage />} />
					<Route path="/community" element={<CommunityPage />} />
					<Route path="/challenges" element={<ChallengesPage />} />
					<Route path="/resources" element={<ResourcesPage />} />
					<Route path="/sos" element={<SOSPage />} />
				</Routes>
			</motion.main>
		</div>
	);
}

export default App;
