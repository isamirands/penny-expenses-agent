FROM public.ecr.aws/lambda/python:3.12

# Copy requirements first for better caching
COPY requirements.txt ./
RUN python3.12 -m pip install -r requirements.txt -t .

# Copy application code and utility modules
COPY app.py ./
COPY utils/ ./utils/

CMD ["app.lambda_handler"]
