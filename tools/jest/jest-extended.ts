// https://jest-extended.jestcommunity.dev/docs/getting-started/setup

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-var-requires -- FIXME
const matchers: jest.ExpectExtendMap = require("jest-extended");

(expect as unknown as jest.Expect).extend(matchers);
