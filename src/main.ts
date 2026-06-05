import { bootstrapApplication } from '@angular/platform-browser';
import { Amplify } from 'aws-amplify';
import { App } from './app/app';
import { appConfig } from './app/app.config';
import { environment } from './environments/environment';

function parseRedirectUrls(value: string): string[] {
  return value
    .split(',')
    .map((url) => url.trim())
    .filter((url) => url.length > 0);
}

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: environment.cognito.userPoolId,
      userPoolClientId: environment.cognito.userPoolClientId,
      loginWith: {
        oauth: {
          domain: environment.cognito.oauth.domain,
          scopes: [...environment.cognito.oauth.scopes],
          redirectSignIn: parseRedirectUrls(environment.cognito.oauth.redirectSignIn),
          redirectSignOut: parseRedirectUrls(environment.cognito.oauth.redirectSignOut),
          responseType: environment.cognito.oauth.responseType,
        },
      },
    },
  },
});

bootstrapApplication(App, appConfig).catch((err) => console.error(err));
