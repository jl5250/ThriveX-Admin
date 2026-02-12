import React, { useEffect, useState, useRef } from 'react';
import GitHubCalendar from 'react-github-calendar';
import dayjs from 'dayjs';
import { Select } from 'antd';
import {
  FiLayout,
  FiServer,
  FiGlobe,
  FiCalendar,
  FiLoader,
} from 'react-icons/fi';
import { useConfigStore } from '@/stores';

interface Commit {
  commit: {
    author: { date: string };
    message: string;
  };
}

interface TimelineItem {
  label: string;
  children: React.ReactNode;
}

type TimelineCardIcon = React.ComponentType<{ size?: number; className?: string }>;

// 骨架屏
const ProjectSkeleton = () => (
  <div className="bg-white dark:bg-boxdark rounded-2xl p-6 border border-slate-100 dark:border-strokedark shadow-sm h-full transition-colors">
    <div className="flex items-center gap-3 mb-6 border-b border-slate-100 dark:border-strokedark pb-4">
      <div className="w-10 h-10 bg-slate-200 dark:bg-boxdark-2 rounded-lg animate-pulse" />
      <div className="h-6 w-32 bg-slate-200 dark:bg-boxdark-2 rounded animate-pulse" />
    </div>
    <div className="space-y-6">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex gap-4">
          <div className="flex flex-col items-center">
            <div className="w-3 h-3 rounded-full bg-slate-200 dark:bg-strokedark animate-pulse" />
            <div className="w-0.5 flex-1 bg-slate-100 dark:bg-strokedark mt-1" />
          </div>
          <div className="flex-1 space-y-2 pb-4">
            <div className="h-4 w-24 bg-slate-200 dark:bg-boxdark-2 rounded animate-pulse" />
            <div className="h-4 w-full bg-slate-200 dark:bg-boxdark-2 rounded animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

// 自定义时间轴
const ProjectTimelineCard = ({
  title,
  icon: Icon,
  data,
  colorClass,
}: {
  title: string;
  icon: TimelineCardIcon;
  data: TimelineItem[];
  colorClass: string;
}) => {
  return (
    <div className="bg-white dark:bg-boxdark rounded-2xl border border-slate-100 dark:border-strokedark shadow-sm hover:shadow-md transition-all duration-300 flex flex-col h-full overflow-hidden group">
      <div className="p-5 border-b border-slate-50 dark:border-strokedark bg-slate-50/50 dark:bg-boxdark-2/50 flex items-center gap-3">
        <div className={`p-2.5 rounded-xl ${colorClass} bg-opacity-10 dark:bg-opacity-20 text-opacity-100`}>
          <Icon size={20} className={colorClass.replace('bg-', 'text-')} />
        </div>
        <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg tracking-tight">{title}</h3>
      </div>

      <div className="p-5 overflow-y-auto max-h-[500px] scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-strokedark scrollbar-track-transparent">
        {data.length === 0 ? (
          <div className="text-center py-10 text-slate-400 dark:text-slate-500 text-sm">暂无提交记录</div>
        ) : (
          <div className="relative pl-2">
            {/* 贯穿线 */}
            <div className="absolute top-2 left-[6.5px] bottom-0 w-[2px] bg-slate-100 dark:bg-strokedark" />

            {data.map((item, index) => (
              <div key={index} className="relative flex gap-4 mb-6 last:mb-0 group/item">
                {/* 装饰点 */}
                <div className={`
                  relative z-10 w-3.5 h-3.5 ml-[-7px] rounded-full border-2 border-white dark:border-boxdark shadow-sm mt-1.5 flex-shrink-0
                  ${index === 0 ? 'bg-green-500 ring-2 ring-green-100 dark:ring-green-900/50' : 'bg-slate-300 dark:bg-strokedark group-hover/item:bg-indigo-400 dark:group-hover/item:bg-indigo-500'}
                  transition-colors duration-300
                `} />

                {/* 内容 */}
                <div className="flex-1">
                  <time className="text-xs font-medium text-slate-400 dark:text-slate-500 mb-1 block font-mono">
                    {item.label}
                  </time>
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed break-all bg-slate-50 dark:bg-boxdark-2 p-3 rounded-lg border border-slate-100 dark:border-strokedark group-hover/item:border-slate-200 dark:group-hover/item:border-strokedark transition-colors">
                    {item.children}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const IterativePage = () => {
  const theme = useConfigStore((state) => state.colorMode);
  const [loading, setLoading] = useState<boolean>(false);
  const [initialLoading, setInitialLoading] = useState<boolean>(true);
  const isFirstLoadRef = useRef<boolean>(true);

  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [yearList, setYearList] = useState<{ value: number; label: string }[]>([]);

  const [blogData, setBlogData] = useState<TimelineItem[]>([]);
  const [adminData, setAdminData] = useState<TimelineItem[]>([]);
  const [serverData, setServerData] = useState<TimelineItem[]>([]);

  const getCommitData = async (project: string) => {
    try {
      if (isFirstLoadRef.current) setInitialLoading(true);
      else setLoading(true);

      const res = await fetch(`https://api.github.com/repos/LiuYuYang01/${project}/commits?per_page=10`);
      const data = await res.json();
      const result = data?.map((item: Commit) => ({
        label: dayjs(item.commit.author.date).format('YYYY-MM-DD HH:mm'), // 优化了日期格式
        children: item.commit.message,
      }));

      switch (project) {
        case 'ThriveX-Blog':
          sessionStorage.setItem('blog_project_iterative', JSON.stringify(result));
          setBlogData(result);
          break;
        case 'ThriveX-Admin':
          sessionStorage.setItem('admin_project_iterative', JSON.stringify(result));
          setAdminData(result);
          break;
        case 'ThriveX-Server':
          sessionStorage.setItem('server_project_iterative', JSON.stringify(result));
          setServerData(result);
          break;
      }
      isFirstLoadRef.current = false;
    } catch (error) {
      console.error(error);
    } finally {
      setInitialLoading(false);
      setLoading(false);
    }
  };

  type SetTimelineData = React.Dispatch<React.SetStateAction<TimelineItem[]>>;

  const loadData = (key: string, setter: SetTimelineData, project: string) => {
    const cached: TimelineItem[] = JSON.parse(sessionStorage.getItem(key) ?? '[]');
    if (cached.length > 0) {
      setter(cached);
    } else {
      getCommitData(project);
    }
  };

  useEffect(() => {
    const currentYear = dayjs().year();
    const list = Array.from({ length: 5 }, (_, i) => currentYear - i);
    setYearList(list.map((value) => ({ value, label: String(value) })));

    loadData('blog_project_iterative', setBlogData, 'ThriveX-Blog');
    loadData('admin_project_iterative', setAdminData, 'ThriveX-Admin');
    loadData('server_project_iterative', setServerData, 'ThriveX-Server');

    const timer = setTimeout(() => setInitialLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="p-4 font-sans text-slate-600 dark:text-slate-300 transition-colors">
      <div className="max-w-7xl mx-auto mb-4">
        <div className="relative flex flex-col md:flex-row md:items-center justify-center gap-4 bg-white dark:bg-boxdark px-6 py-3 rounded-2xl shadow-sm border border-slate-100 dark:border-strokedark transition-colors">
          <h1 className="flex items-center gap-4 font-extrabold text-slate-800 dark:text-slate-100">
            <img src="/logo.png" alt="" className="w-8 h-8" />
            <span className="text-xl font-extrabold text-slate-800 dark:text-slate-100">不断改善、成为最佳</span>
          </h1>

          <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-3 bg-slate-50 dark:bg-boxdark-2 px-4 py-1 rounded-xl border border-slate-100 dark:border-strokedark transition-colors">
            <span className="text-slate-500 dark:text-slate-400 text-sm font-medium flex items-center gap-2">
              <FiCalendar size={16} />
              年份视图:
            </span>

            <Select
              variant="borderless"
              defaultValue={year}
              options={yearList}
              onChange={setYear}
              className="min-w-[100px] !font-bold text-slate-700 dark:text-slate-200 [&_.ant-select-selector]:!bg-transparent"
              dropdownStyle={{ borderRadius: '12px', padding: '8px' }}
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mb-4">
        <div className="bg-white dark:bg-boxdark p-6 md:p-8 rounded-2xl shadow-sm border border-slate-100 dark:border-strokedark flex flex-col items-center justify-center relative overflow-hidden group transition-colors">
          {/* 背景装饰 */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-green-50 dark:bg-green-900/20 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2 pointer-events-none" />

          <div className="relative z-10 w-full overflow-x-auto pb-2 flex justify-center">
            <GitHubCalendar
              username="liuyuyang01"
              year={year}
              fontSize={12}
              blockSize={13}
              blockMargin={4}
              colorScheme={theme}
              theme={{
                light: ['#f0f2f5', '#9be9a8', '#40c463', '#30a14e', '#216e39'],
                dark: ['#1e293b', '#166534', '#15803d', '#16a34a', '#22c55e'],
              }}
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        {initialLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
            <ProjectSkeleton />
            <ProjectSkeleton />
            <ProjectSkeleton />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative">
            {loading && (
              <div className="absolute inset-0 z-20 bg-white/60 dark:bg-boxdark/80 backdrop-blur-[1px] rounded-3xl flex items-center justify-center transition-colors">
                <div className="bg-white dark:bg-boxdark-2 p-4 rounded-full shadow-lg border border-slate-100 dark:border-strokedark">
                  <FiLoader className="animate-spin text-indigo-600 dark:text-indigo-400" size={32} />
                </div>
              </div>
            )}

            <ProjectTimelineCard
              title="ThriveX Blog"
              icon={FiGlobe}
              colorClass="bg-blue-500"
              data={blogData}
            />

            <ProjectTimelineCard
              title="ThriveX Admin"
              icon={FiLayout}
              colorClass="bg-yellow-500"
              data={adminData}
            />

            <ProjectTimelineCard
              title="ThriveX Server"
              icon={FiServer}
              colorClass="bg-red-500"
              data={serverData}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default IterativePage;
