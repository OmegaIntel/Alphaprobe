import weaviate
# get all collections 
weaviate_client = weaviate.connect_to_local()
# Get the schema of the database
schema = weaviate_client.collections.delete('B113769c776e4c0a8ebf03d121773494')

weaviate_client.close()