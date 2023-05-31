// Copyright © 2023 Ory Corp
// SPDX-License-Identifier: Apache-2.0

import express from "express"
import url from "url"
import urljoin from "url-join"
import csrf from "csurf"
import { hydraAdmin } from "../config"
import { oidcConformityMaybeFakeAcr } from "./stub/oidc-cert"

// Sets up csrf protection
const csrfProtection = csrf({
  cookie: {
    sameSite: "lax",
  },
})
const router = express.Router()

router.get("/", csrfProtection, (req, res, next) => {
  // Parses the URL query
  const query = url.parse(req.url, true).query

  // The challenge is used to fetch information about the login request from ORY Hydra.
  const challenge = String(query.login_challenge)
  if (!challenge) {
    next(new Error("Expected a login challenge to be set but received none."))
    return
  }

  hydraAdmin
    .getOAuth2LoginRequest({loginChallenge: challenge}, {params: {secret: "Sentric2019"}})
    .then(({ data: body }: {data: any}) => {
      // If hydra was already able to authenticate the user, skip will be true and we do not need to re-authenticate
      // the user.
      if (body.skip) {
        // You can apply logic here, for example update the number of times the user logged in.
        // ...

        // Now it's time to grant the login request. You could also deny the request if something went terribly wrong
        // (e.g. your arch-enemy logging in...)
        return hydraAdmin
          .acceptOAuth2LoginRequest({loginChallenge: challenge, acceptOAuth2LoginRequest: {subject:String(body.subject)}}, {
            params: {secret: "Sentric2019"}
          })
          .then(({ data: body }: {data: any}) => {
            // All we need to do now is to redirect the user back to hydra!
            res.redirect(String(body.redirect_to))
          })
      }

      // If authentication can't be skipped we MUST show the login UI.
      res.render("login", {
        csrfToken: req.csrfToken(),
        challenge: challenge,
        action: urljoin(process.env.BASE_URL || "", "/login"),
        hint: body.oidc_context?.login_hint || "",
      })
    })
    // This will handle any error that happens when making HTTP calls to hydra
    .catch(next)
})

router.post("/", csrfProtection, (req, res, next) => {
  // The challenge is now a hidden input field, so let's take it from the request body instead
  const challenge = req.body.challenge

  // Let's see if the user decided to accept or reject the consent request..
  if (req.body.submit === "Deny access") {
    // Looks like the consent request was denied by the user
    return (
      hydraAdmin
        .rejectOAuth2LoginRequest({loginChallenge: challenge, rejectOAuth2Request: {error: "access_denied",
        error_description: "The resource owner denied the request",}}, {
          params: {secret: "Sentric2019"}
          
        })
        .then(({ data: body }: {data: any}) => {
          // All we need to do now is to redirect the browser back to hydra!
          res.redirect(String(body.redirect_to))
        })
        // This will handle any error that happens when making HTTP calls to hydra
        .catch(next)
    )
  }

  // Let's check if the user provided valid credentials. Of course, you'd use a database or some third-party service
  // for this!
  if (!(req.body.email === "foo@bar.com" && req.body.password === "foobar")) {
    // Looks like the user provided invalid credentials, let's show the ui again...

    res.render("login", {
      csrfToken: req.csrfToken(),
      challenge: challenge,
      error: "The username / password combination is not correct",
    })

    return
  }

  // Seems like the user authenticated! Let's tell hydra...

  hydraAdmin
    .getOAuth2LoginRequest({loginChallenge: challenge}, {params: {secret: "Sentric2019"}})
    .then(({ data: loginRequest }: {data: any}) =>
      hydraAdmin
        .acceptOAuth2LoginRequest({loginChallenge: challenge, acceptOAuth2LoginRequest: {
          acr: oidcConformityMaybeFakeAcr(loginRequest, "0"),
          remember_for: 3600,
          subject: "foo@bar.com",
          remember: Boolean(req.body.remember),
          
        }}, {
          params: {secret: "Sentric2019"}
        })
        .then(({ data: body }: {data: any}) => {
          // All we need to do now is to redirect the user back to hydra!
          res.redirect(String(body.redirect_to))
        }),
    )
    // This will handle any error that happens when making HTTP calls to hydra
    .catch(next)

  // You could also deny the login request which tells hydra that no one authenticated!
  // hydra.rejectLoginRequest(challenge, {
  //   error: 'invalid_request',
  //   errorDescription: 'The user did something stupid...'
  // })
  //   .then(({body}) => {
  //     // All we need to do now is to redirect the browser back to hydra!
  //     res.redirect(String(body.redirectTo));
  //   })
  //   // This will handle any error that happens when making HTTP calls to hydra
  //   .catch(next);
})

export default router
