import { buildSchema } from 'graphql';
import { mergeOutputs } from '@graphql-codegen/plugin-helpers';
import { plugin } from '../src/index.js';

describe('custom-scalar-usage', () => {
  it('Should output usage object correctly', async () => {
    const schema = buildSchema(/* GraphQL */ `
      scalar DateTime
      scalar LocalDate
      type Query {
        user: User!
      }
      type User {
        id: ID!
        name: String!
        signupDate: LocalDate
        creationDate: DateTime!
        logins: [DateTime]
        referrals: [DateTime!]!
      }
    `);
    const result = mergeOutputs([await plugin(schema, [], { scalars: ['DateTime', 'LocalDate'] })]);
    expect(result).toMatchSnapshot();
  });

  it('Should only output specified types', async () => {
    const schema = buildSchema(/* GraphQL */ `
      scalar DateTime
      type Query {
        user: User!
      }
      type User {
        id: ID!
        name: String!
        signupDate: DateTime
        creationDate: DateTime!
        logins: [DateTime]
        referrals: [DateTime!]!
      }
    `);
    const result = mergeOutputs([await plugin(schema, [], { scalars: ['LocalDate'] })]);
    expect(result).toMatchSnapshot();
  });
});
