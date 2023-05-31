// Copyright © 2023 Ory Corp
// SPDX-License-Identifier: Apache-2.0

import { Configuration, V0alpha2Api } from "@ory/client"

const baseOptions: any = {}

if (process.env.MOCK_TLS_TERMINATION) {
  baseOptions.headers = { "X-Forwarded-Proto": "https" }
}

const configuration = new Configuration({
  basePath: "https://auth.sentric.it",
  username: "4830f912-4248-4ec3-90ee-2e3ac3b448e5", // ory client-id
  password: "ONUi~AGVuT5RydbHwCLgz5-FAs", // ory client-secret
  baseOptions,
})

const hydraAdmin = new V0alpha2Api(configuration)

export { hydraAdmin }
