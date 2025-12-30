import torch
import sys

print("=" * 50)
print("AgriSahayak - CUDA & PyTorch Verification")
print("=" * 50)
print(f"Python Version: {sys.version}")
print(f"PyTorch Version: {torch.__version__}")
print(f"CUDA Available: {torch.cuda.is_available()}")

if torch.cuda.is_available():
    print(f"CUDA Version: {torch.version.cuda}")
    print(f"GPU Name: {torch.cuda.get_device_name(0)}")
    print(f"GPU Memory: {torch.cuda.get_device_properties(0).total_memory / 1024**3:.2f} GB")
    
    # Quick GPU test
    x = torch.randn(1000, 1000, device='cuda')
    y = torch.matmul(x, x)
    print(f"GPU Test: PASSED (matrix multiplication successful)")
else:
    print("CUDA not available - will use CPU")
    print("To enable CUDA, ensure NVIDIA drivers and CUDA toolkit are installed")

print("=" * 50)
