import matplotlib.pyplot as plt
import numpy as np

x = np.array([1, 3, 2, 5, 7, 4, 6])
y = x*2
plt.plot(x, y)
# plt.show()

# Second line
x1 = np.array([5, 7, 4, 6, 8, 5, 7])
y1 = x1*2
plt.plot(x1, y1, color='red', linestyle='dashed', marker='o')
plt.show()