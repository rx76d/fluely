import { useState } from 'react';
import { User, Briefcase, Award, History, Target, Save } from 'lucide-react';
import { useStore } from './useStore';

export function Profile() {
  const { userProfile, setUserProfile } = useStore();
  const [profile, setProfile] = useState(userProfile);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setUserProfile(profile);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-950 text-gray-800 dark:text-zinc-200">
      <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-8 sm:space-y-10 custom-scrollbar">

        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-xl">
              <User size={20} className="text-blue-500" />
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 dark:text-zinc-500">Professional Identity</h3>
              <p className="text-[11px] text-gray-400 dark:text-zinc-600 font-medium">This helps Fluely personalize its suggested answers during interviews.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wide flex items-center gap-2">
                Full Name
              </label>
              <input
                type="text"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                placeholder="John Doe"
                className="w-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl px-5 py-4 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-blue-500/50 transition-all font-medium"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wide flex items-center gap-2">
                <Briefcase size={14} /> Target Role / Title
              </label>
              <input
                type="text"
                value={profile.role}
                onChange={(e) => setProfile({ ...profile, role: e.target.value })}
                placeholder="Data Scientist"
                className="w-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl px-5 py-4 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-blue-500/50 transition-all font-medium"
              />
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/10 rounded-xl">
              <Award size={20} className="text-purple-500" />
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 dark:text-zinc-500">Expertise & Experience</h3>
              <p className="text-[11px] text-gray-400 dark:text-zinc-600 font-medium">List your key strengths and career highlights.</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wide flex items-center gap-2">
                Core Skills
              </label>
              <textarea
                rows={3}
                value={profile.skills}
                onChange={(e) => setProfile({ ...profile, skills: e.target.value })}
                placeholder="Python, Machine Learning, Statistical Analysis, Data Visualization ..."
                className="w-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl px-5 py-4 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-blue-500/50 transition-all font-medium resize-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wide flex items-center gap-2">
                <History size={14} /> Experience Brief
              </label>
              <textarea
                rows={4}
                value={profile.experience}
                onChange={(e) => setProfile({ ...profile, experience: e.target.value })}
                placeholder="Briefly describe your career history and notable achievements... "
                className="w-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl px-5 py-4 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-blue-500/50 transition-all font-medium resize-none"
              />
            </div>
          </div>
        </section>

        <section className="space-y-6 pb-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/10 rounded-xl">
              <Target size={20} className="text-green-500" />
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 dark:text-zinc-500">Interview Goals</h3>
              <p className="text-[11px] text-gray-400 dark:text-zinc-600 font-medium">What are you looking for in your next role?</p>
            </div>
          </div>

          <div className="space-y-2">
            <textarea
              rows={3}
              value={profile.goals}
              onChange={(e) => setProfile({ ...profile, goals: e.target.value })}
              placeholder="Seeking a high-impact Data Science role where I can apply advanced analytics and machine learning to drive strategic decision-making. I am passionate about leveraging large-scale datasets to build predictive models that solve complex business challenges..."
              className="w-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl px-5 py-4 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-blue-500/50 transition-all font-medium resize-none"
            />
          </div>
        </section>

      </div>

      <div className="p-8 border-t border-gray-50 dark:border-white/5 bg-gray-50/30 dark:bg-white/5">
        <button
          onClick={handleSave}
          className="w-full flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-2xl transition-all shadow-xl shadow-blue-500/10 active:scale-95"
        >
          {saved ? 'Profile Saved Successfully' : 'Save Interview Profile'}
          <Save size={20} />
        </button>
      </div>
    </div>
  );
}
