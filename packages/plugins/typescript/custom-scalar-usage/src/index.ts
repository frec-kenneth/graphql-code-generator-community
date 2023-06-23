import { extname } from 'path';
import { GraphQLScalarType, GraphQLSchema, getNamedType, isInterfaceType, isObjectType } from 'graphql';
import { PluginFunction, PluginValidateFn, Types } from '@graphql-codegen/plugin-helpers';
import { CustomScalarUsageConfig } from './config.js';

export const plugin: PluginFunction<CustomScalarUsageConfig> = (
  schema: GraphQLSchema,
  documents: Types.DocumentFile[],
  config: CustomScalarUsageConfig,
) => {
  const results: Types.ComplexPluginOutput[] = [];

  if (config.scalars) {
    results.push(generateCustomScalarUsageLists(schema, config));
  }

  return {
    prepend: results.reduce((prev, r) => [...prev, ...(r.prepend || [])], []),
    append: results.reduce((prev, r) => [...prev, ...(r.append || [])], []),
    content: results.map(r => r.content).join('\n'),
  };
};

function generateCustomScalarUsageLists(
  schema: GraphQLSchema,
  config: CustomScalarUsageConfig,
): Types.ComplexPluginOutput {
  const typeMap = schema.getTypeMap();
  //for each type, get fields that are custom scalar types
  // console.log(typeMap);
  const scalarTypes = {};
  config.scalars.forEach(scalar => { scalarTypes[scalar] = {} });
  Object.keys(typeMap).forEach((typeName) => {
    const type = typeMap[typeName];
    if (typeName.startsWith('__') || !(isObjectType(type) || isInterfaceType(type))) return;
    const fields = type.getFields();
    if (!fields) return;
    Object.keys(fields).forEach(fieldName => {
      const field = fields[fieldName];
      if (getNamedType(field.type) instanceof GraphQLScalarType) {
        const scalarResult = scalarTypes[getNamedType(field.type).name];
        if (scalarResult) {
          if (!scalarResult[typeName]) scalarResult[typeName] = [];
          scalarResult[typeName].push(field.name);
        }
      }
    });
  });
  const content = "export const scalarUsage = " + JSON.stringify(scalarTypes, null, 2);
  return {
    content,
  };
}

export const validate: PluginValidateFn<CustomScalarUsageConfig> = async (
  schema: GraphQLSchema,
  documents: Types.DocumentFile[],
  config,
  outputFile: string,
) => {
  if (extname(outputFile) !== '.ts' && extname(outputFile) !== '.tsx') {
    throw new Error(`Plugin "custom-scalar-usage" requires extension to be ".ts" or ".tsx"!`);
  }
};
