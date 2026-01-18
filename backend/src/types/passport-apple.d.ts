declare module 'passport-apple' {
  import { Strategy } from 'passport-oauth2';

  interface AppleProfile {
    id: string;
    displayName?: string;
    name?: {
      familyName?: string;
      givenName?: string;
    };
    emails?: Array<{
      value: string;
      verified?: boolean;
    }>;
    photos?: Array<{
      value: string;
    }>;
    provider: string;
  }

  export class Strategy extends passport_oauth2.Strategy {
    constructor(options: any, verify: any);
    name: string;
    authenticate(req: any, options?: any): void;
  }

  namespace passport_oauth2 {
    interface Strategy {
      _oauth2: any;
      _oauth: any;
    }
  }
}

declare module 'passport-oauth2' {
  export interface Strategy {
    _oauth2?: any;
    _oauth?: any;
  }
}
