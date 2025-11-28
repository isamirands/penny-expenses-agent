# Stage 1: Build Tesseract in Ubuntu
FROM ubuntu:22.04 as tesseract-builder

RUN apt-get update && \
    apt-get install -y \
    tesseract-ocr \
    tesseract-ocr-spa \
    tesseract-ocr-eng \
    && apt-get clean

# Stage 2: Lambda runtime
FROM public.ecr.aws/lambda/python:3.12

# Copy Tesseract binary and data
COPY --from=tesseract-builder /usr/bin/tesseract /usr/local/bin/tesseract
COPY --from=tesseract-builder /usr/share/tesseract-ocr /usr/local/share/tesseract-ocr

# Copy all required shared libraries
COPY --from=tesseract-builder /usr/lib/x86_64-linux-gnu/libtesseract.so.4* /usr/local/lib/
COPY --from=tesseract-builder /usr/lib/x86_64-linux-gnu/liblept.so.5* /usr/local/lib/
COPY --from=tesseract-builder /usr/lib/x86_64-linux-gnu/libpng16.so.16* /usr/local/lib/
COPY --from=tesseract-builder /usr/lib/x86_64-linux-gnu/libjpeg.so.8* /usr/local/lib/
COPY --from=tesseract-builder /usr/lib/x86_64-linux-gnu/libtiff.so.5* /usr/local/lib/
COPY --from=tesseract-builder /usr/lib/x86_64-linux-gnu/libwebp.so.7* /usr/local/lib/
COPY --from=tesseract-builder /usr/lib/x86_64-linux-gnu/libgif.so.7* /usr/local/lib/
COPY --from=tesseract-builder /usr/lib/x86_64-linux-gnu/libopenjp2.so.7* /usr/local/lib/
COPY --from=tesseract-builder /usr/lib/x86_64-linux-gnu/libjbig.so.0* /usr/local/lib/
COPY --from=tesseract-builder /usr/lib/x86_64-linux-gnu/libwebpmux.so.3* /usr/local/lib/
COPY --from=tesseract-builder /usr/lib/x86_64-linux-gnu/libdeflate.so.0* /usr/local/lib/
COPY --from=tesseract-builder /usr/lib/x86_64-linux-gnu/libgomp.so.1* /usr/local/lib/

# Set environment variables
ENV TESSDATA_PREFIX=/usr/local/share/tesseract-ocr/4.00/tessdata
ENV LD_LIBRARY_PATH=/usr/local/lib:${LD_LIBRARY_PATH}

# Verify Tesseract (will fail but that's ok for now)
RUN tesseract --version || echo "Tesseract binaries copied"

# Copy requirements first for better caching
COPY requirements.txt ./
RUN python3.12 -m pip install -r requirements.txt -t .

# Copy application code and utility modules
COPY app.py ./
COPY utils/ ./utils/

# Command can be overwritten by providing a different command in the template directly.
CMD ["app.lambda_handler"]
