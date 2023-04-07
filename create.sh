#!/usr/bin/env bash

REGION=us-west-1

ENDPOINTURL=https://dynamodb.$REGION.amazonaws.com
# ENDPOINTURL=http://localhost:8000

OUTPUT=text

TableList=("DemoTable01" "DemoTable02" "DemoTable03")
TableName=""


if [ $# -gt 0 ]
  then
    aws dynamodb create-table --cli-input-json "file://tables/$1.json" --region $REGION --endpoint-url $ENDPOINTURL --output $OUTPUT --query 'TableDescription.TableArn'
  else

    for TableName in "${TableList[@]}"
    do
          aws dynamodb create-table --cli-input-json "file://tables/$TableName.json" --region $REGION --endpoint-url $ENDPOINTURL --output $OUTPUT --query 'TableDescription.TableArn'

    done

fi

echo Table creation in process, please wait...
# await final table creation
aws dynamodb wait table-exists --table-name $TableName --region $REGION --endpoint-url $ENDPOINTURL

