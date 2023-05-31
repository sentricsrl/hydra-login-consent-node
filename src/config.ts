// Copyright © 2023 Ory Corp
// SPDX-License-Identifier: Apache-2.0

import { Configuration, V0alpha2Api } from "@ory/client"

const baseOptions: any = {}

if (process.env.MOCK_TLS_TERMINATION) {
  baseOptions.headers = { "X-Forwarded-Proto": "https" }
}

const configuration = new Configuration({
  basePath: "https://auth.sentric.it",
  username: "df73692b-1216-49c8-a14f-5a8a1b32a3fb", // ory client-id
  password: "YNOWwA_1O9HH0MQ6a3PCuOu1uY", // ory client-secret
  baseOptions,
})

const hydraAdmin = new V0alpha2Api(configuration)

export { hydraAdmin }
