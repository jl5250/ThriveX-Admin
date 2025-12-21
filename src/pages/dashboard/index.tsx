import { useState, useEffect } from 'react';
import InfoCard from './components/Info';
import Stats from './components/Stats';
import SystemNotification, { shouldShowLoginNotification } from '@/components/SystemNotification';

export default () => {
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    // 检查是否需要显示登录通知
    if (shouldShowLoginNotification()) {
      setShowNotification(true);
    }
  }, []);

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
