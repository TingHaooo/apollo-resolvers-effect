# apollo-resolvers-effect
[![Coverage Status](https://coveralls.io/repos/github/TingHaooo/apollo-resolvers-effect/badge.svg?branch=master)](https://coveralls.io/github/TingHaooo/apollo-resolvers-effect?branch=master)
[![](https://badgen.net/badge/license/Apache/green)](https://github.com/Naereen/StrapDown.js/blob/master/LICENSE)
[![](https://badgen.net/badge/npm/v1.0.0/green)](https://www.npmjs.com/package/apollo-resolvers-effect)
[![](https://badgen.net/github/status/zeit/hyper/master/ci)](https://www.npmjs.com/package/apollo-resolvers-effect)

Reactively add reusable logic in Apollostack's GraphQL server resolvers.

## Overview

When setup a apollo server, some features have to implement same logic in a lot of resolvers, like "authorization", "push notification", etc.
This package's goal is to turn those logic into effect, it can decrease duplicated logic and improve maintainability, in addition, there is need to rewrite original resolvers when using this package.

## Installing

```
yarn add apollo-resolvers-effect

npm install apollo-resolvers-effect
```

## Quick Start

```typescript
// Create authorization effect
const checkAuthorizationEffect = (_p, _v, context, _i) => {
  if (context.user.role !== Role.Admin) {
    throw Error(`You don't have authorization on this operation`)
  }
}

// Log operation effect
const logAfterOperation = (_p, _v, _c, info) => {
  console.log(info.fieldName)
}

// Determine which operations need to add effects
const effects = [
  {
    type: 'All',
    afterEffects: [logAfterOperation]
  },
  {
    operationNames: ['deleteUser', 'updateUser', 'createUser'],
    beforeEffects: [checkAuthorizationEffect]
  }
]

// Create resolvers with effect
const resolversWithEffect = withEffect({
    resolvers,
    effects,
    effectErrorHandler: e => console.log(e)
  })

// Create server
const server = new ApolloServer({
  typeDefs,
  context: () => {
    const context = {
      // login user information
      user: fakeUsers[0]
    }
    return context
  },
  resolvers: resolversWithEffect
})
```
