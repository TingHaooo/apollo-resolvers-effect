import { ApolloServer, gql } from 'apollo-server'
import { Effect, withEffect } from '../index'
import { MutationResolvers, QueryResolvers, User } from './types'

import { MyContext } from './context'
import { Users } from './fakeData'
import { fakePromise } from './fakePromise'
import fs from 'fs'

interface Resolvers {
  Query: QueryResolvers
  Mutation: MutationResolvers
}

interface CreateServer {
  effects: Effect<QueryResolvers, MutationResolvers, MyContext>[]
}

const typeDefs = gql(
  fs.readFileSync('./src/testUtils/schema.graphql', { encoding: 'utf8' })
)

let fakeUsers = Users
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
    deleteUser: async (parent, variables, context) => {
      const { id } = variables
      await fakePromise(
        () => (fakeUsers = fakeUsers.filter(user => user.id !== id))
      )
      return `User ${id} is deleted`
    }
  }
}

const createServer = ({ effects }: CreateServer) => {
  return new ApolloServer({
    typeDefs,
    context: () => {
      const context: MyContext = {
        projectName: 'Apollo-Resolvers-Effect'
      }
      return context
    },
    resolvers: withEffect<QueryResolvers, MutationResolvers, any>({
      resolvers,
      effects,
      effectErrorHandler: e => console.log(e.message)
    })
  })
}

export default createServer
