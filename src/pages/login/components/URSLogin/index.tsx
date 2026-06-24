import React, { useEffect } from 'react';

type Props = {
  login: () => void;
};

const Mail: React.FC<Props> = ({ login }) => {
  //todo host
  // const host =
  //   import.meta.env.PROD || window.location.origin.includes('local')
  //     ? window.location.origin
  //     : import.meta.env.VITE_BACKEND_URL;

  const cssFiles = `customLogin.css`;

  async function handleLogin(_username: string) {
    //处理业务的登录逻辑
    login();
  }
  function init() {
    try {
      const ele = document.getElementById('urs-login');
      const host =  window.EEVEE_ENV ?  `${window.location.origin}` : `${window.location.origin}/public`;

      if (ele?.childElementCount) {
        ele.innerHTML = '';
      }
      // https://urs.hz.netease.com/docDetail.html?pid=384#/
      new URS({
        newCDN: 1, // 必须，代表使用的 CDN 是连通性更好的 SNI 域名
        version: 4, // 必须，代表版本 4
        ...(!/.163.com$/.test(window.location.origin) && {
          cookieDomain: 'netease.com', // 产品页面地址非 163.com 域名的必填，可填入的域名列表：https://urs.hz.netease.com/docDetail.html?pid=384#/
          regCookieDomain: 'netease.com', // 产品页面地址非 163.com 域名的必填，可填入的域名列表：https://urs.hz.netease.com/docDetail.html?pid=384#/
        }),
        cssDomain: `${host}/`,
        cssFiles,
        includeBox: 'urs-login', // 必须，登录框的外层节点的 id
        product: 'fuxizhongbao', // 必填，申请的产品名，对应工单生成的配置 product
        promark: 'wPyZSiF', // 必填，申请的组件 ID，被分派 ID，对应工单生成的配置 promark
        host, // 必填，产品域名，对应工单生成的配置 host
        page: 'login', // 可选，首屏显示登录，可选 register
        single: 0, // 可选，只接入登录或注册模块
        isHttps: 1,

        mobileFirst: 0,
        smsLoginFirst: 1,
        
        goEmailLoginTxt: '网易邮箱账号登录',
        placeholder: {
          account: '请输入邮箱地址',
          pwd:  '请输入邮箱密码',
        },
        domainSuffixs: '@163.com,@126.com,@yeah.net,@188.com,@vip.163.com,@vip.126.com',
        setMailloginClause: 1,
        gotoRegText:  '还没有账号？立即注册',
        forgetPwdText:  '忘记密码？',


        needMobileLogin: 1,
        needMobileReg: 1,
        regMbTxt: '去注册',
        gotoRegTextMb: '去注册',
        gotoLoginTextMb: '去登录>>',

        logincb: handleLogin,
      });
    } catch {}
  }
  useEffect(() => {
    const script = document.createElement('script');
    script.onerror = () => {
      // message 加载失败降级到 nginx，可以在 load 事件重新初始化
      const cdnPath = 'https://dl.reg.163.com/webzj/ngx/message.js';
      const scriptNgx = document.createElement('script');
      scriptNgx.src = cdnPath;
      document.body.appendChild(scriptNgx);
    };
    script.onload = () => {
      init();
    };
    script.src = 'https://urswebzj.nosdn.127.net/webzj_cdn101/message.js';
    document.body.appendChild(script);
  }, []);

  return (
    <div className="absolute top-1/2 left-1/2 -translate-1/2 w-full h-full m-0">
      <div id="urs-login" />
    </div>
  );
};

export default Mail;
