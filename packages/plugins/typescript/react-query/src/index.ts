import { extname } from 'path';
import { concatAST, FragmentDefinitionNode, GraphQLSchema, Kind } from 'graphql';
import { oldVisit, PluginFunction, PluginValidateFn, Types } from '@graphql-codegen/plugin-helpers';
import { LoadedFragment } from '@graphql-codegen/visitor-plugin-common';
import { ReactQueryRawPluginConfig } from './config.js';
import { ReactQueryVisitor } from './visitor.js';

export const plugin: PluginFunction<ReactQueryRawPluginConfig, Types.ComplexPluginOutput> = (
  schema: GraphQLSchema,
  documents: Types.DocumentFile[],
  config: ReactQueryRawPluginConfig,
) => {
  const allAst = concatAST(documents.map(v => v.document));

  const allFragments: LoadedFragment[] = [
    ...(
      allAst.definitions.filter(
        d => d.kind === Kind.FRAGMENT_DEFINITION,
      ) as FragmentDefinitionNode[]
    ).map(fragmentDef => ({
      node: fragmentDef,
      name: fragmentDef.name.value,
      onType: fragmentDef.typeCondition.name.value,
      isExternal: false,
    })),
    ...(config.externalFragments || []),
  ];

  const visitor = new ReactQueryVisitor(schema, allFragments, config, documents);
  const visitorResult = oldVisit(allAst, { leave: visitor });

  if (visitor.hasOperations) {
    return {
      prepend: [...visitor.getImports(), visitor.getFetcherImplementation()],
      content: [
        visitor.fragments,
        ...visitorResult.definitions.filter(t => typeof t === 'string'),
      ].join('\n'),
    };
  }

  return {
    prepend: [...visitor.getImports()],
    content: [
      visitor.fragments,
      ...visitorResult.definitions.filter(t => typeof t === 'string'),
    ].join('\n'),
  };
};

export const validate: PluginValidateFn<any> = async (
  schema: GraphQLSchema,
  documents: Types.DocumentFile[],
  config: ReactQueryVisitor,
  outputFile: string,
) => {
  if (extname(outputFile) !== '.ts' && extname(outputFile) !== '.tsx') {
    throw new Error(`Plugin "typescript-react-query" requires extension to be ".ts" or ".tsx"!`);
  }
};

export { ReactQueryVisitor };
