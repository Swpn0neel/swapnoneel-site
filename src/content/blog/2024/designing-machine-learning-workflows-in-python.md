---
title: "Designing Machine Learning Workflows in Python"
date: "2024-02-02T16:07:14.579Z"
description: >-
  A machine-learning workflow turns data into features, trains and evaluates a model, and saves the result. Build that process in Python with Fashion MNIST and IMDb examples.
cover: >-
  https://web.archive.org/web/20240417063106/https://cdn.hashnode.com/res/hashnode/image/upload/v1706889691867/9b2f329b-3ac3-47e5-a748-c9a1eadee06a.png
link: "https://swapnoneel.hashnode.dev/designing-machine-learning-workflows-in-python"
tags:
  - python
  - machine-learning
  - data-science
  - workflows
updated: "2026-07-23T13:07:48.942Z"
---

Machine learning code is rarely just a model. You also need data that the model can read, a repeatable way to turn that data into features, an evaluation that matches the problem, and a way to save the result for later.

That collection of steps is a machine learning workflow. Python is useful here because the same language can handle data loading with Pandas, numerical work with NumPy, classical models with scikit-learn, and neural networks with TensorFlow or PyTorch.

The order matters. If you clean the test data using information from the training data, your score becomes too optimistic. If you choose a metric that does not match the cost of an error, a high score may hide a bad product decision.

## Start with the question

Before opening a notebook, write down what the model should predict and what a useful prediction would change. Predicting whether a review is positive is a classification problem. Predicting the price of a house is a regression problem. Grouping similar customers without labels is a clustering problem.

This decision affects the target column, the model family, and the metric. It also tells you what kind of error matters. In a fraud system, missing a suspicious transaction may matter more than reviewing an extra legitimate one. In a delivery estimate, the size of the error may matter more than whether the answer is on one side of a threshold.

## Build the workflow in order

### Prepare the data

The model cannot learn from a messy table in the same way a person can. You need to decide which rows are usable, which column is the target, how missing values are handled, and how categories or text become numbers.

The test set must remain untouched while you make those choices. It is meant to imitate data the model has never seen.

This example shows the shape of a classification workflow. It assumes `data.csv` contains numeric feature columns and a column named `target`.

```python
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, precision_score, recall_score

dataset = pd.read_csv("data.csv")
target_column = "target"

# Remove rows that cannot be used for the target decision.
dataset = dataset.dropna(subset=[target_column])

X = dataset.drop(columns=[target_column])
y = dataset[target_column]

# Keep the test set separate until the final evaluation.
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42,
    stratify=y,
)

# Fit preprocessing only on the training data by putting it in a pipeline.
model = make_pipeline(
    StandardScaler(),
    LogisticRegression(max_iter=1000),
)
model.fit(X_train, y_train)

y_pred = model.predict(X_test)
print("Accuracy:", accuracy_score(y_test, y_pred))
print("Precision:", precision_score(y_test, y_pred, zero_division=0))
print("Recall:", recall_score(y_test, y_pred, zero_division=0))
```

The file and column names are assumptions, so change them for your dataset. The important part is the boundary: split first, fit transformations on the training data, and use the test data only for the final check.

### Create useful features

A feature is an input the model can use. Raw data is not always arranged in a useful form. A timestamp may become hour and weekday columns. A sentence may become word features. A table with hundreds of related numeric columns may need dimensionality reduction.

Principal component analysis, or PCA, is one way to reduce numeric features to a smaller representation. Fit it on the training data, then apply the already-fitted transformation to the test data.

```python
from sklearn.decomposition import PCA

pca = PCA(n_components=2, random_state=42)
X_train_pca = pca.fit_transform(X_train)
X_test_pca = pca.transform(X_test)
```

PCA is not automatically a good feature choice. Two components are easy to plot, but they may discard information that the model needs. Compare the reduced version with the original features rather than assuming fewer columns means a better model.

### Choose and compare models

Model selection is a comparison against the problem, not a contest for the most complicated algorithm. A linear model can be easier to inspect and may work well when the relationship is simple. A tree-based model can capture different kinds of boundaries but may need its own tuning.

Cross-validation gives you several training and validation splits instead of trusting one lucky split. Use the same scoring rule for each candidate.

```python
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import cross_val_score

logistic_model = LogisticRegression(max_iter=1000)
forest_model = RandomForestClassifier(random_state=42)

logistic_scores = cross_val_score(
    logistic_model,
    X_train_pca,
    y_train,
    cv=5,
    scoring="accuracy",
)
forest_scores = cross_val_score(
    forest_model,
    X_train_pca,
    y_train,
    cv=5,
    scoring="accuracy",
)

best_model = (
    forest_model
    if np.mean(forest_scores) > np.mean(logistic_scores)
    else logistic_model
)
print("Logistic regression:", np.mean(logistic_scores))
print("Random forest:", np.mean(forest_scores))
```

The comparison above uses the PCA features from the previous step. In a real project, put PCA inside a scikit-learn pipeline before cross-validation so each fold learns its own transformation. That prevents information from the validation fold leaking into training.

### Train and evaluate

Training is where the model learns parameters from the training set. Evaluation asks how well those learned parameters work on data held back from that process.

```python
best_model.fit(X_train_pca, y_train)
y_pred = best_model.predict(X_test_pca)

accuracy = accuracy_score(y_test, y_pred)
precision = precision_score(y_test, y_pred, zero_division=0)
recall = recall_score(y_test, y_pred, zero_division=0)

print("Accuracy:", accuracy)
print("Precision:", precision)
print("Recall:", recall)
```

Accuracy is the fraction of correct predictions. Precision asks how many predicted positives were actually positive. Recall asks how many real positives the model found. Choose the metric before looking for the best score, otherwise it is easy to optimize for a number that does not describe the product.

### Save the model

Training can be expensive, and a deployed application needs the learned model without retraining it for every request. Save the fitted model together with every preprocessing step it needs.

```python
import joblib

joblib.dump(best_model, "model.pkl")
```

If the feature transformation is separate from the model, save that transformation too. A production prediction must receive data in the same shape and scale used during training.

## Example with Fashion MNIST

Fashion MNIST is a useful small example because every image has the same shape and the dataset already comes with training and test splits. The model below classifies the images into ten categories.

```python
import numpy as np
import tensorflow as tf
from tensorflow import keras

fashion_mnist = keras.datasets.fashion_mnist
(X_train, y_train), (X_test, y_test) = fashion_mnist.load_data()

# Pixel values arrive as integers from 0 to 255.
X_train = X_train.astype("float32") / 255.0
X_test = X_test.astype("float32") / 255.0

model = keras.Sequential([
    keras.Input(shape=(28, 28)),
    keras.layers.Flatten(),
    keras.layers.Dense(128, activation="relu"),
    keras.layers.Dense(10, activation="softmax"),
])

model.compile(
    optimizer="adam",
    loss="sparse_categorical_crossentropy",
    metrics=["accuracy"],
)
model.fit(X_train, y_train, epochs=10, validation_split=0.1)

test_loss, test_accuracy = model.evaluate(X_test, y_test, verbose=0)
print(f"Test loss: {test_loss:.4f}")
print(f"Test accuracy: {test_accuracy:.4f}")

model.save("fashion_mnist_model.keras")
```

The dataset is loaded with the [keras.datasets.fashion](http://keras.datasets.fashion)\_mnist module. The images are stored as 28-by-28 pixel arrays, and dividing by 255 puts each pixel into a small numeric range.

The `Flatten` layer turns each image into one vector. The hidden dense layer learns combinations of those pixel values, and the final layer produces ten class scores. `sparse_categorical_crossentropy` fits integer labels such as `0` through `9` without requiring you to convert them into one-hot arrays.

The model trains with [model.fit](http://model.fit)() on the training images and checks the test images only after training. When the code is run through the terminal, the model is trained, evaluated, and the test loss and accuracy are printed, as shown below:

![Terminal output of Fashion MNIST model training and evaluation](https://cdn.hashnode.com/res/hashnode/image/upload/v1706888496190/80a5fff8-8809-43d7-b8cc-8459949edd5c.png)

## Example with IMDb sentiment

Text needs a different feature step. A logistic regression model cannot read raw sentences, so `TfidfVectorizer` turns words into numbers based on how often they appear in a review and how unusual they are across the dataset.

```python
import joblib
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score
from sklearn.model_selection import train_test_split

df = pd.read_csv("imdb_reviews.csv")
X = df["review"]
y = df["sentiment"]

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42,
    stratify=y,
)

vectorizer = TfidfVectorizer()
X_train_vectors = vectorizer.fit_transform(X_train)
X_test_vectors = vectorizer.transform(X_test)

model = LogisticRegression(max_iter=1000)
model.fit(X_train_vectors, y_train)

y_pred = model.predict(X_test_vectors)
accuracy = accuracy_score(y_test, y_pred)
print(f"Accuracy: {accuracy:.4f}")

joblib.dump(model, "sentiment_analysis_model.pkl")
joblib.dump(vectorizer, "vectorizer.pkl")
```

The dataset is loaded with [pd.read](http://pd.read)\_csv() into a DataFrame. In this example, `review` contains the text and `sentiment` contains the label. The split happens before fitting the vectorizer, which keeps vocabulary information from the test set out of training.

The [model.fit](http://model.fit)() call learns the relationship between the training reviews and their labels. The `model.predict()` call then produces labels for reviews it did not see during training. Finally, `joblib.dump()` saves both the classifier and the vectorizer because the deployed application needs to transform new text in the same way. The Keras example uses [model.save](http://model.save)() for the same reason.

When the code is run through the terminal, the model is trained, evaluated, and the accuracy is printed, as shown below:

![Terminal output of sentiment analysis model training and accuracy](https://cdn.hashnode.com/res/hashnode/image/upload/v1706889095784/94b6cb10-93a0-4b56-8e9d-0cd704d94764.png)

## Moving from a notebook to an application

Keep a record of the data columns, preprocessing steps, model version, and evaluation split. A saved model without the code that prepared its inputs is hard to trust and harder to reproduce.

Before deployment, test the prediction path with new examples and invalid input. Watch for missing columns, unexpected categories, empty text, and values outside the range used during training. Log model inputs carefully and avoid storing private data unless you have a clear reason to do so.

Once the model is running, monitor the inputs and the outcomes you can observe. Data changes over time, and a score from last month cannot tell you whether today's requests still look like the training data.

## What to remember

A machine learning workflow is a chain. Start with a clearly defined prediction, prepare the data without leaking the test set, create features that represent the problem, compare models with a meaningful metric, evaluate on held-out data, and save every piece needed for prediction.

The code is only one part of the job. The decisions around the code determine whether the final number tells you anything useful. I still find the data split and metric choice easier to get wrong than the model import, which is probably why they deserve more attention than the flashy part.

For more posts, you can follow me on [Twitter (swapnoneel123)](http://twitter.com/swapnoneel123). You can also check my [GitHub (Swpn0neel)](https://github.com/Swpn0neel) for projects.

![Machine learning model evaluation matrix and performance metrics](https://cdn.hashnode.com/res/hashnode/image/upload/v1706889699251/e0331511-ab42-4e0c-997c-5cbe529b3888.png)
