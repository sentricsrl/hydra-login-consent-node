// Copyright © 2023 Ory Corp
// SPDX-License-Identifier: Apache-2.0

import { Configuration, OAuth2Api } from "@ory/hydra-client"

const baseOptions: any = {}

if (process.env.MOCK_TLS_TERMINATION) {
  baseOptions.headers = { "X-Forwarded-Proto": "https" }
}

const configuration = new Configuration({
  basePath: "https://auth.sentric.it",
  username: "7d8631d0-f410-4666-b4e2-0baa6183edd4", // ory client-id
  password: "CeIPLPwRSC2V2f6zzDRIK0vwkq", // ory client-secret
})

const hydraAdmin = new OAuth2Api(configuration)

export { hydraAdmin }
