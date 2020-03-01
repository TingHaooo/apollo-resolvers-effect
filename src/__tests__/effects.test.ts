import { MutationResolvers, QueryResolvers, Role } from '../testUtils/types'
import {
  logAfterAllOperations,
  logAfterMutationOperations,
  logAfterOperations,
  logAfterQueryOperations,
  logBeforeAllOperations,
  logBeforeMutationOperations,
  logBeforeOperations,
  logBeforeQueryOperations
} from '../testUtils/effects'

import { Effect } from '../index'
import { MyContext } from '../testUtils/context'
import createServer from '../testUtils/server'
import { createTestClient } from 'apollo-server-testing'

const spy = jest.spyOn(console, 'log')
beforeEach(() => {
  spy.mockReset()
})

const userQuery = /* GraphQL */ `
  query UserQuery($id: ID!) {
    user(id: $id) {
      id
      name
      role
    }
  }
`

const userQueryExpect = expect.objectContaining({
  id: expect.any(String),
  name: expect.any(String),
  role: expect.any(String)
})

const usersQuery = /* GraphQL */ `
  query UsersQuery($query: QueryUserInput!) {
    users(query: $query) {
      id
      name
      role
    }
  }
`

const usersQueryExpect = expect.arrayContaining([
  expect.objectContaining({
    id: expect.any(String),
    name: expect.any(String),
    role: expect.any(String)
  })
])

const createUserMutation = /* GraphQL */ `
  mutation CreateUserMutation($payload: CreateUserInput!) {
    createUser(payload: $payload) {
      id
      name
      role
    }
  }
`

const createUserExpect = expect.objectContaining({
  id: expect.any(String),
  name: expect.any(String),
  role: expect.any(String)
})

const deleteUserMutation = /* GraphQL */ `
  mutation DeleteUserMutation($id: ID!) {
    deleteUser(id: $id)
  }
`

const deleteUserExpect = expect.any(String)

const description = `
  Type "All" effect will execute on every query and mutation resolver\n
  Type "Query" effect will execute on every query resolver\n
  Type "Mutation" effect will execute on every mutation resolver\n
  "OperationNames" effect will execute on every resolver in operationsNames\n
  `

describe('Correctly execute effects', () => {
  it(description, async () => {
    const effects: Effect<QueryResolvers, MutationResolvers, MyContext>[] = [
      {
        type: 'All',
        beforeEffects: [logAfterAllOperations],
        afterEffects: [logBeforeAllOperations]
      },
      {
        type: 'Mutation',
        beforeEffects: [logBeforeMutationOperations],
        afterEffects: [logAfterMutationOperations]
      },
      {
        type: 'Query',
        beforeEffects: [logBeforeQueryOperations],
        afterEffects: [logAfterQueryOperations]
      },
      {
        operationNames: ['user', 'createUser'],
        beforeEffects: [logBeforeOperations],
        afterEffects: [logAfterOperations]
      }
    ]
    const client = createTestClient(createServer({ effects }))

    // user query
    const { data: userResponse } = await client.query({
      query: userQuery,
      variables: { id: '1' }
    })
    expect(userResponse?.user).toEqual(userQueryExpect)
    expect(spy).toBeCalledWith('Before all operations effect: user')
    expect(spy).toBeCalledWith('After all operations effect: user')
    expect(spy).toBeCalledWith('Before query operations effect: user')
    expect(spy).toBeCalledWith('After query operations effect: user')
    expect(spy).toBeCalledWith('Before operationNames effect: user')
    expect(spy).toBeCalledWith('After operationNames effect: user')

    // users query
    const { data: usersResponse } = await client.query({
      query: usersQuery,
      variables: { query: { name: 'Jason' } }
    })
    expect(usersResponse?.users).toEqual(usersQueryExpect)
    expect(spy).toBeCalledWith('Before all operations effect: users')
    expect(spy).toBeCalledWith('After all operations effect: users')
    expect(spy).toBeCalledWith('Before query operations effect: users')
    expect(spy).toBeCalledWith('After query operations effect: users')

    // createUser Mutation
    const { data: createUserResponse } = await client.mutate({
      mutation: createUserMutation,
      variables: {
        payload: {
          name: 'Rober',
          role: Role.Admin
        }
      }
    })
    expect(createUserResponse?.createUser).toEqual(createUserExpect)
    expect(spy).toBeCalledWith('Before all operations effect: createUser')
    expect(spy).toBeCalledWith('After all operations effect: createUser')
    expect(spy).toBeCalledWith('Before mutation operations effect: createUser')
    expect(spy).toBeCalledWith('After mutation operations effect: createUser')
    expect(spy).toBeCalledWith('Before operationNames effect: createUser')
    expect(spy).toBeCalledWith('After operationNames effect: createUser')

    // deleteUser Mutation
    const { data: deleteUserResponse } = await client.mutate({
      mutation: deleteUserMutation,
      variables: { id: '1' }
    })
    expect(deleteUserResponse?.deleteUser).toEqual(deleteUserExpect)
    expect(spy).toBeCalledWith('Before all operations effect: deleteUser')
    expect(spy).toBeCalledWith('After all operations effect: deleteUser')
    expect(spy).toBeCalledWith('Before mutation operations effect: deleteUser')
    expect(spy).toBeCalledWith('After mutation operations effect: deleteUser')
  })

  it('Correctly access context in effects', async () => {
    const effects: Effect<QueryResolvers, MutationResolvers, MyContext>[] = [
      {
        operationNames: ['user'],
        beforeEffects: [
          (_, __, context, ___) => console.log(context.projectName)
        ],
        afterEffects: [
          (_, __, context, ___) => console.log(context.projectName)
        ]
      }
    ]

    const client = createTestClient(createServer({ effects }))

    // user query
    await client.query({
      query: userQuery,
      variables: { id: '1' }
    })

    expect(spy).toBeCalledWith('Apollo-Resolvers-Effect')
    expect(spy).toBeCalledWith('Apollo-Resolvers-Effect')
  })

  it('Correctly log error when effect throw errors', async () => {
    const effects: Effect<QueryResolvers, MutationResolvers, MyContext>[] = [
      {
        operationNames: ['user'],
        beforeEffects: [
          (_, __, context, ___) => {
            throw new Error('fake error')
          }
        ],
        afterEffects: [
          (_, __, context, ___) => {
            throw new Error('fake error')
          }
        ]
      }
    ]

    const client = createTestClient(createServer({ effects }))

    // user query
    await client.query({
      query: userQuery,
      variables: { id: '1' }
    })

    expect(spy).toBeCalledWith('fake error')
    expect(spy).toBeCalledWith('fake error')
  })
})
