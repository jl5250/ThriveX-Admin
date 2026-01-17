import { Card, Select, Spin, Timeline, TimelineItemProps, Skeleton } from 'antd';
import { useEffect, useState, useRef } from 'react';
import GitHubCalendar from 'react-github-calendar';
import dayjs from 'dayjs';

import Title from '@/components/Title';

interface Commit {
  commit: {
    author: { date: string };
    message: string;
  };
}

export default () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [initialLoading, setInitialLoading] = useState<boolean>(true);
  const isFirstLoadRef = useRef<boolean>(true);

  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [yearList, setYearList] = useState<{ value: number; label: string }[]>([]);

  const [blog_iterativeRecording, setBlog_IterativeRecording] = useState<TimelineItemProps[]>([]);
  const [admin_iterativeRecording, setAdmin_IterativeRecording] = useState<TimelineItemProps[]>([]);
  const [server_iterativeRecording, setServer_IterativeRecording] = useState<TimelineItemProps[]>([]);

  // 从github获取最近10次迭代记录
  const getCommitData = async (project: string) => {
    try {
      // 如果是第一次加载，使用 initialLoading
      if (isFirstLoadRef.current) {
        setInitialLoading(true);
      } else {
        setLoading(true);
      }

      const res = await fetch(`https://api.github.com/repos/LiuYuYang01/${project}/commits?per_page=10`);
      const data = await res.json();
      const result = data?.map((item: Commit) => ({
        label: dayjs(item.commit.author.date).format('YYYY-MM-DD HH:mm:ss'),
        children: item.commit.message,
      }));

      switch (project) {
        case 'ThriveX-Blog':
          sessionStorage.setItem('blog_project_iterative', JSON.stringify(result));
          setBlog_IterativeRecording(result);
          break;
        case 'ThriveX-Admin':
          sessionStorage.setItem('admin_project_iterative', JSON.stringify(result));
          setAdmin_IterativeRecording(result);
          break;
        case 'ThriveX-Server':
          sessionStorage.setItem('server_project_iterative', JSON.stringify(result));
          setServer_IterativeRecording(result);
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

  useEffect(() => {
    // 获取当前年份
    const currentYear = dayjs().year();
    // 生成最近10年的年份数组
    const yearList = Array.from({ length: 10 }, (_, i) => currentYear - i);
    setYearList(yearList.map((item) => ({ value: item, label: item + '' })));

    // 如果缓存中有值就无需重新调接口
    const blog_project_iterative = JSON.parse(sessionStorage.getItem('blog_project_iterative') || '[]');
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    blog_project_iterative.length ? setBlog_IterativeRecording(blog_project_iterative) : getCommitData('ThriveX-Blog');

    const admin_project_iterative = JSON.parse(sessionStorage.getItem('admin_project_iterative') || '[]');
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    admin_project_iterative.length ? setAdmin_IterativeRecording(admin_project_iterative) : getCommitData('ThriveX-Admin');

    const server_project_iterative = JSON.parse(sessionStorage.getItem('server_project_iterative') || '[]');
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    server_project_iterative.length ? setServer_IterativeRecording(server_project_iterative) : getCommitData('ThriveX-Server');
  }, []);

  // 初始加载时显示骨架屏
  if (initialLoading) {
    return (
      <div>
        {/* Title 骨架屏 */}
        <Card className="[&>.ant-card-body]:!py-2 [&>.ant-card-body]:!px-5 mb-4">
          <Skeleton.Input active size="large" style={{ width: 150, height: 32 }} />
        </Card>

        <Card className="border-stroke mt-2 min-h-[calc(100vh-160px)] [&>.ant-card-body]:!py-2 [&>.ant-card-body]:!px-5">
          {/* 年份选择器骨架屏 */}
          <div className="flex flex-col items-center mt-2 mb-6">
            <div className="ml-5 mb-6">
              <Skeleton.Input active size="small" style={{ width: 120, height: 24 }} />
            </div>
            {/* GitHub Calendar 骨架屏 */}
            <Skeleton active paragraph={{ rows: 8 }} style={{ width: '100%', maxWidth: 900 }} />
          </div>

          {/* Timeline 骨架屏 */}
          <div className="overflow-auto w-full">
            <div className="flex w-[1350px] mx-auto">
              {[1, 2, 3].map((item) => (
                <div key={item} className={`w-[400px] ${item === 2 ? 'mx-[50px]' : ''}`}>
                  <Skeleton.Input active size="default" style={{ width: 200, height: 28, margin: '0 auto 24px' }} />
                  <Skeleton active paragraph={{ rows: 10 }} />
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <Title value="项目迭代记录"></Title>

      <Spin spinning={loading}>
        <Card className="border-stroke mt-2 min-h-[calc(100vh-160px)]">
          <div className="flex flex-col items-center mt-2 mb-22">
            <div className="ml-5 mb-6">
              <span>年份切换：</span>

              <Select size="small" defaultValue={year} options={yearList} onChange={setYear} className="w-20" />
            </div>

            <GitHubCalendar username="liuyuyang01" year={year} />
          </div>

          <div className="overflow-auto w-full">
            <div className="flex w-[1350px] mx-auto">
              <div className="w-[400px]">
                <h3 className="text-xl text-center pb-6 font-bold text-gradient block">ThriveX-Blog</h3>
                <Timeline mode="left" items={blog_iterativeRecording} />
              </div>

              <div className="w-[400px] mx-[50px]">
                <h3 className="text-xl text-center pb-6 font-bold text-gradient block">ThriveX-Admin</h3>
                <Timeline mode="left" items={admin_iterativeRecording} />
              </div>

              <div className="w-[400px]">
                <h3 className="text-xl text-center pb-6 font-bold text-gradient block">ThriveX-Server</h3>
                <Timeline mode="left" items={server_iterativeRecording} />
              </div>
            </div>
          </div>
        </Card>
      </Spin>
    </div>
  );
};
