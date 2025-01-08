// app/utils/cookies.ts
export const setCookie = (name: string, value: string, maxAge: number = 7200) => {
    document.cookie = `${name}=${value}; path=/; max-age=${maxAge}; SameSite=Strict`;
  };
  
  export const getCookie = (name: string): string | null => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      return parts.pop()?.split(';').shift() || null;
    }
    return null;
  };
  
  export const removeCookie = (name: string) => {
    document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  };