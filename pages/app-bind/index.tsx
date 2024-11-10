import { useEffect } from 'react';
import { useRouter } from 'next/router';

const AppBind = () => {
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const { code } = router.query;

      if (code) {
        // 构建自定义协议 URL
        const customProtocolUrl = `yuributa://app-bind?code=${code}`;

        // 通过 window.location.href 重定向到自定义协议
        window.location.href = customProtocolUrl;
      }
    }
  }, [router.query]);

  return (
    <div>
      <h1>即将跳转到app处理...</h1>
    </div>
  );
};

export default AppBind;
