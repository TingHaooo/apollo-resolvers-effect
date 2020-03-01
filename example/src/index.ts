import { ApolloServer, gql } from 'apollo-server'
import { Effect, EffectFn, withEffect } from 'apollo-resolvers-effect'
import { MutationResolvers, QueryResolvers, Role, User } from './types'

import { MyContext } from './context'
import { fakePromise } from './utils'
import fs from 'fs'

// fake data
let fakeUsers: User[] = [
  {
    id: '1',
    name: 'Elaine',
    role: Role.Sales
  },
  {
    id: '2',
    name: 'Andy',
    role: Role.Admin
  },
  {
    id: '3',
    name: 'Jason',
    role: Role.Developer
  }
]

// typeDefs
const typeDefs = gql(
  fs.readFileSync('./src/schema.graphql', { encoding: 'utf8' })
)

// resolvers
interface Resolvers {
  Query: QueryResolvers
  Mutation: MutationResolvers
}

const resolvers: Resolvers = {
  Query: {
    user: async (parent, variables, context) => {
      const { id } = variables
      const user = await fakePromise<User>(() =>
        fakeUsers.find(user => user.id === id)
      )
      if (!user) {
        return null
      }
      return user
    },
    users: async (parent, variables, context) => {
      const {
        query: { name, role }
      } = variables

      const users = await fakePromise<User[]>(() =>
        fakeUsers.filter(user => {
          let pass = false
          if (name) {
            pass = user.name === name
          }
          if (role) {
            pass = user.role === role
          }
          return pass
        })
      )

      return users
    }
  },
  Mutation: {
    createUser: async (parent, variables, context) => {
      const { payload } = variables
      const newUser = {
        id: (fakeUsers.length + 1).toString(),
        ...payload
      }
      await fakePromise(() => fakeUsers.push(newUser))
      return newUser
    },
    updateUser: async (parent, variables, context) => {
      const { id, payload } = variables
      let updatedUser
      await fakePromise(() => {
        fakeUsers = fakeUsers.map(user => {
          if (user.id === id) {
            updatedUser = {
              ...user,
              ...payload
            }
            return updatedUser
          }
          return user
        })
      })

      return updatedUser
    },
    deleteUser: async (parent, variables, context) => {
      const { id } = variables
      await fakePromise(
        () => (fakeUsers = fakeUsers.filter(user => user.id !== id))
      )
      return `User ${id} is deleted`
    }
  }
}

// effect
type MyEffect = EffectFn<MyContext>

const checkAuthorizationEffect: MyEffect = (_p, _v, context, _i) => {
  if (context.user.role !== Role.Admin) {
    throw Error(`You don't have authorization on this operation`)
  }
}

const logOperationInfoEffect: MyEffect = (_p, _v, context, info) => {
  console.log(`
    userName: ${context.user.name}\n
    operationName: ${info.fieldName}`)
}

const effects: Effect<QueryResolvers, MutationResolvers, MyContext>[] = [
  {
    type: 'All',
    afterEffects: [logOperationInfoEffect]
  },
  {
    operationNames: ['deleteUser', 'updateUser', 'createUser'],
    beforeEffects: [checkAuthorizationEffect]
  }
]

const server = new ApolloServer({
  typeDefs,
  context: () => {
    const context: MyContext = {
      // login user information
      user: fakeUsers[0]
    }
    return context
  },
  resolvers: withEffect<QueryResolvers, MutationResolvers, any>({
    resolvers,
    effects,
    effectErrorHandler: e => console.log(e)
  })
})

server.listen('4000', () => {
  console.log('Server listen to port "4000"')
})

export default server
