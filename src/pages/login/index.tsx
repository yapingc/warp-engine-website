import { useState } from 'react';
import { useLoginInfo } from '@fuxi/eevee-hooks';
import { Icon } from '@fuxi/eevee-icon';
import { Button, Divider, Flex } from '@fuxi/eevee-ui';

import openIdIcon from '@/assets/images/openid-logo.png';
import { getNextUrl } from '@/utils/safeNav';

import URSLogin from './components/URSLogin';
import { LoginType } from './types';

const DanqingLogin = () => {
  const [loginType, setLoginType] = useState<LoginType>(LoginType.OPENID);
  const { loginByOpenApi } = useLoginInfo();

  const handleLoginTypeChange = () => {
    if (loginType === LoginType.PHONE) {
      loginByOpenApi(getNextUrl());
    } else {
      setLoginType(LoginType.PHONE);
    }
  };

  const handleOpenIdLogin = () => {
    loginByOpenApi(getNextUrl());
  };

  const handleUrsLogin = () => {
    window.location.href = window.location.origin + '/rbac/urscheck?path=' + getNextUrl();
  };

  return (
    <div className="flex h-screen w-screen bg-cover bg-center bg-[url('/fuxi-static/danqing/common/index/mfz4ziq5_037005.png')]">
      <Flex align="center" className="h-screen w-screen">
        <div className="h-screen flex-1 flex items-center justify-center">
          <Flex vertical align="center" justify="center" className="text-center">
            <img src="/fuxi-static/danqing/common/index/m9w68h2y_041849.png" alt="logo" className="w-[176px]" />
            <div
              className="text-[30px] leading-[38px]"
              style={{ color: 'var(--text-color-5)', fontWeight: 'var(--font-weight-normal)' }}
            >
              AIGC 美术设计高效创作平台
            </div>
          </Flex>
        </div>
        <div className="h-full" style={{ backgroundColor: 'var(--white)' }}>
          <Flex
            vertical
            align="center"
            justify="center"
            className="relative overflow-hidden h-full w-[772px] min-h-[760px] p-[120px] flex flex-col items-center justify-center border border-solid"
            style={{ backgroundColor: 'var(--white)', borderColor: 'var(--color-border)', fontSize: 'var(--font-size-xl)' }}
          >
            <Flex vertical align="center" justify="center" className="w-full absolute top-[120px]">
              <img src="/fuxi-static/danqing/common/index/m1ah6e2v_905862.png" alt="logo" className="w-[172px]" />
              <div
                className="text-center text-[30px] font-600 leading-[38px]"
                style={{ color: 'var(--text-color-5)' }}
              >
                欢迎来到丹青约
              </div>
            </Flex>
            <Flex
              vertical
              align="center"
              justify="center"
              className="w-full relative flex flex-col items-center justify-center min-h-0 max-h-full h-[412px]"
              gap={16}
            >
              {loginType === LoginType.OPENID ? (
                <Button
                  className="w-full h-[58px] rounded-[38px] text-[20px] text-center leading-[28px] !border-none !bg-gradient-to-r from-[#302cfa] to-[#6829fb] !text-[var(--white)] font-[var(--font-weight-strong)] hover:opacity-90"
                  icon={<img src={openIdIcon} alt="openid-icon" className="mr-[6px] w-6" />}
                  onClick={handleOpenIdLogin}
                >
                  网易员工登录（OpenID）
                </Button>
              ) : (
                <URSLogin login={handleUrsLogin} />
              )}
            </Flex>
            <div className="absolute bottom-[75px] w-[510px]">
              <Flex align="center" justify="center" className="w-full mb-[38px]" gap={12}>
                <Divider className="flex-1 min-w-0" />
                <span
                  className="text-center leading-6 px-3 shrink-0"
                  style={{ color: 'var(--text-color-6)', fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-normal)' }}
                >
                  更多方式
                </span>
                <Divider className="flex-1 min-w-0" />
              </Flex>
              <Flex
                align="center"
                justify="center"
                className="w-full cursor-pointer"
                gap={6}
                onClick={handleLoginTypeChange}
              >
                <Icon
                  name={loginType === LoginType.OPENID ? 'login-icon' : 'openid-logo'}
                  className={loginType !== LoginType.OPENID ? 'text-[#ff4d4f]' : ''}
                  size={24}
                />
                <span
                  className="text-center text-[20px] leading-[28px]"
                  style={{ color: 'var(--text-color-1)', fontWeight: 'var(--font-weight-normal)' }}
                >
                  {loginType === LoginType.OPENID ? '手机号/邮箱登录' : '网易员工登录（OpenID）'}
                </span>
              </Flex>
            </div>
          </Flex>
        </div>
      </Flex>
    </div>
  );
};

export default DanqingLogin;
