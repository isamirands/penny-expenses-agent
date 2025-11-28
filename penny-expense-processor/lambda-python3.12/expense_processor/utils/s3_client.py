"""
S3 client for temporary image storage
"""
import logging
import boto3
from typing import Optional

logger = logging.getLogger(__name__)

class S3Client:
    """Client for storing and retrieving images from S3"""
    
    def __init__(self, bucket_name: str):
        """
        Initialize S3 client
        
        Args:
            bucket_name: Name of S3 bucket
        """
        self.bucket_name = bucket_name
        self.client = boto3.client('s3')
    
    def upload_image(self, key: str, image_bytes: bytes, content_type: str = 'image/jpeg') -> str:
        """
        Upload image to S3
        
        Args:
            key: S3 object key
            image_bytes: Image content as bytes
            content_type: Content type
            
        Returns:
            S3 URI
        """
        try:
            logger.info(f"Uploading {len(image_bytes)} bytes to s3://{self.bucket_name}/{key}")
            
            self.client.put_object(
                Bucket=self.bucket_name,
                Key=key,
                Body=image_bytes,
                ContentType=content_type
            )
            
            s3_uri = f"s3://{self.bucket_name}/{key}"
            logger.info(f"Uploaded to {s3_uri}")
            
            return s3_uri
            
        except Exception as e:
            logger.error(f"Error uploading to S3: {e}")
            raise
    
    def download_image(self, key: str) -> bytes:
        """
        Download image from S3
        
        Args:
            key: S3 object key
            
        Returns:
            Image content as bytes
        """
        try:
            logger.info(f"Downloading from s3://{self.bucket_name}/{key}")
            
            response = self.client.get_object(
                Bucket=self.bucket_name,
                Key=key
            )
            
            image_bytes = response['Body'].read()
            logger.info(f"Downloaded {len(image_bytes)} bytes")
            
            return image_bytes
            
        except Exception as e:
            logger.error(f"Error downloading from S3: {e}")
            raise
    
    def delete_image(self, key: str):
        """
        Delete image from S3
        
        Args:
            key: S3 object key
        """
        try:
            logger.info(f"Deleting s3://{self.bucket_name}/{key}")
            
            self.client.delete_object(
                Bucket=self.bucket_name,
                Key=key
            )
            
            logger.info("Deleted successfully")
            
        except Exception as e:
            logger.error(f"Error deleting from S3: {e}")
    
    def generate_presigned_url(self, key: str, expiration: int = 3600) -> str:
        """
        Generate presigned URL for S3 object
        
        Args:
            key: S3 object key
            expiration: URL expiration in seconds
            
        Returns:
            Presigned URL
        """
        try:
            url = self.client.generate_presigned_url(
                'get_object',
                Params={
                    'Bucket': self.bucket_name,
                    'Key': key
                },
                ExpiresIn=expiration
            )
            
            return url
            
        except Exception as e:
            logger.error(f"Error generating presigned URL: {e}")
            raise

