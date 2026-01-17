import { useState, useEffect, useRef } from 'react';
import { Skeleton, Card } from 'antd';
import InfoCard from './components/Info';
import Stats from './components/Stats';
import SystemNotification, { shouldShowLoginNotification } from '@/components/SystemNotification';

export default () => {
  const [showNotification, setShowNotification] = useState(false);
  const [initialLoading, setInitialLoading] = useState<boolean>(true);
  const isFirstLoadRef = useRef<boolean>(true);

  useEffect(() => {
    // 检查是否需要显示登录通知
    if (shouldShowLoginNotification()) {
      setShowNotification(true);
    }

    // 模拟初始加载，等待子组件加载完成
    if (isFirstLoadRef.current) {
      const timer = setTimeout(() => {
        setInitialLoading(false);
        isFirstLoadRef.current = false;
      }, 500);
      return () => clearTimeout(timer);
    }
  }, []);

  // 初始加载时显示骨架屏
  if (initialLoading) {
    return (
      <div>
        {/* InfoCard 骨架屏 */}
        <div className="bg-primary rounded-md p-6 sm:p-10 flex flex-col justify-center h-[170px] relative overflow-hidden mb-4">
          <div className="relative z-10 w-full flex flex-col">
            <Skeleton.Input active size="large" style={{ width: '500px', height: 40, marginBottom: 10, background: 'rgba(255,255,255,0.3)' }} />
            <Skeleton.Input active size="large" style={{ width: '300px', height: 30, marginBottom: 10, background: 'rgba(255,255,255,0.3)' }} />
            <Skeleton.Input active size="large" style={{ width: '100px', height: 20, marginBottom: 10, background: 'rgba(255,255,255,0.3)' }} />
          </div>
        </div>

        {/* 统计卡片骨架屏 */}
        <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <Card key={item} className="border-stroke [&>.ant-card-body]:!py-2 [&>.ant-card-body]:!px-5">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <Skeleton.Input active size="small" style={{ width: 100, height: 20, marginBottom: 8 }} />
                  <Skeleton.Input active size="large" style={{ width: 80, height: 32 }} />
                </div>
                <Skeleton.Avatar active size={40} shape="square" />
              </div>
            </Card>
          ))}
        </div>

        {/* 图表骨架屏 */}
        <div className="rounded-lg mt-2 grid grid-cols-12 gap-2">
          {/* 访客统计图表 */}
          <Card className="col-span-12 xl:col-span-8 border-stroke [&>.ant-card-body]:!py-2 [&>.ant-card-body]:!px-5">
            <Skeleton.Input active size="default" style={{ width: 150, height: 24, marginBottom: 16 }} />
            <Skeleton active paragraph={{ rows: 10 }} />
          </Card>

          {/* 新老访客图表 */}
          <Card className="col-span-12 xl:col-span-4 border-stroke [&>.ant-card-body]:!py-2 [&>.ant-card-body]:!px-5">
            <Skeleton.Input active size="default" style={{ width: 120, height: 24, marginBottom: 16 }} />
            <Skeleton active paragraph={{ rows: 10 }} />
          </Card>
        </div>

        <SystemNotification open={showNotification} onClose={() => setShowNotification(false)} />
      </div>
    );
  }

  return (
    <div>
      <InfoCard />

      {/* <Card className='[&>.ant-card-body]:!p-3 border border-stroke'>
        <HeaderInfo />
      </Card> */}

      <Stats />

      <SystemNotification open={showNotification} onClose={() => setShowNotification(false)} />
    </div>
  );
};
