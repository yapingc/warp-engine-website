import Cookies from 'js-cookie';

interface SDKError {
  code?: string;
  statusCode?: number;
  message?: string;
  [key: string]: any;
}

interface DanqingSDK {
  api: {
    user: {
      getUserInfo: () => Promise<any>;
    };
  };
}

export interface PermissionItem {
  permissionCode: string;
  permissionName: string;
  hasPermission: boolean;
  extValues?: Record<string, any>;
}

export interface PermissionGroup {
  groupId: number;
  groupName: string;
  roleCode: string;
}

export interface UserInfo {
  name: string;
  userEmail: string;
  avatar: string;
  userId: number;
  permissionList: PermissionItem[];
  identifyType: number;
  isLeihuo: boolean;
  isFuxiAdmin: boolean;
  permissionGroupList: PermissionGroup[];
}

export async function getUserInfo(sdk: DanqingSDK): Promise<UserInfo | null> {
  try {
    const data = await sdk.api.user.getUserInfo();
    return data as UserInfo;
  } catch (error) {
    const err = error as SDKError;
    if (err.code === 'AUTH_ERROR' || err.statusCode === 401) {
      window.location.href = '/login';
      return null;
    }
    throw error;
  }
}

export function isLoggedIn(): boolean {
  const token = Cookies.get('RBAC_TOKEN') || Cookies.get('token');
  return !!token;
}
