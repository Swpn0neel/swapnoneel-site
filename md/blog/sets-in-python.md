---
cover: "https://cdn.hashnode.com/res/hashnode/image/upload/v1674921373638/0fdb5f78-bd54-4eff-8ec4-68ffafb9e30a.png?w=1200&h=630&fit=crop&crop=entropy&auto=compress,format&format=webp&fm=png"
title: "Sets in Python"
date: "2023-01-25T18:09:15.443Z"
description: "Introduction\nSets are unordered collection of data items. They store multiple items in a single variable. Set items are separated by commas and enclosed within curly brackets {}. Sets are unchangeable, meaning you cannot change items of the set once ..."
link: "https://swapnoneel.hashnode.dev/sets-in-python"
---## Introduction

Sets are unordered collection of data items. They store multiple items in a single variable. Set items are separated by commas and enclosed within curly brackets {}. Sets are unchangeable, meaning you cannot change items of the set once created. Sets do not contain duplicate items.

#### Example

```python
info = {"Carla", 19, False, 5.9, 19}
print(info)
```

#### Output

```python
{False, 19, 5.9, 'Carla'}
```

Here we see that the items of set occur in random order and hence they cannot be accessed using index numbers. Also sets do not allow duplicate values.

## Accessing set items:

#### Using a For loop

You can access items of set using a for loop.

#### Example

```python
info = {"Carla", 19, False, 5.9}
for item in info:
    print(item)
```

#### Output

```python
False
Carla
19
5.9
```

## Joining Sets

Sets in python more or less work in the same way as sets in mathematics. We can perform operations like union and intersection on the sets just like in mathematics.

### *I. Union and Update*

The union() and update() methods prints all items that are present in the two sets. The union() method returns a new set whereas update() method adds item into the existing set from another set.

#### Example

```python
cities = {"Tokyo", "Madrid", "Berlin", "Delhi"}
cities2 = {"Tokyo", "Seoul", "Kabul", "Madrid"}
cities3 = cities.union(cities2)
print(cities3)
```

#### Output

```python
{'Tokyo', 'Madrid', 'Kabul', 'Seoul', 'Berlin', 'Delhi'}
```

#### Example

```python
cities = {"Tokyo", "Madrid", "Berlin", "Delhi"}
cities2 = {"Tokyo", "Seoul", "Kabul", "Madrid"}
cities.update(cities2)
print(cities)
```

#### Output

```python
{'Berlin', 'Madrid', 'Tokyo', 'Delhi', 'Kabul', 'Seoul'}
```

### *II. intersection and intersection\_update()*

The intersection() and intersection\_update() methods prints only items that are similar to both the sets. The intersection() method returns a new set whereas intersection\_update() method updates into the existing set from another set.

#### Example

```python
cities = {"Tokyo", "Madrid", "Berlin", "Delhi"}
cities2 = {"Tokyo", "Seoul", "Kabul", "Madrid"}
cities3 = cities.intersection(cities2)
print(cities3)
```

### Output

```python
{'Madrid', 'Tokyo'}
```

### Example

```python
cities = {"Tokyo", "Madrid", "Berlin", "Delhi"}
cities2 = {"Tokyo", "Seoul", "Kabul", "Madrid"}
cities.intersection_update(cities2)
print(cities)
```

### Output

```python
{'Tokyo', 'Madrid'}
```

### *III. symmetric\_difference and symmetric\_difference\_update()*

The symmetric\_difference() and symmetric\_difference\_update() methods prints only items that are not similar to both the sets. The symmetric\_difference() method returns a new set whereas symmetric\_difference\_update() method updates into the existing set from another set.

#### Example

```python
cities = {"Tokyo", "Madrid", "Berlin", "Delhi"}
cities2 = {"Tokyo", "Seoul", "Kabul", "Madrid"}
cities3 = cities.symmetric_difference(cities2)
print(cities3)
```

#### Output

```python
{'Seoul', 'Kabul', 'Berlin', 'Delhi'}
```

#### Example

```python
cities = {"Tokyo", "Madrid", "Berlin", "Delhi"}
cities2 = {"Tokyo", "Seoul", "Kabul", "Madrid"}
cities.symmetric_difference_update(cities2)
print(cities)
```

#### Output

```python
{'Kabul', 'Delhi', 'Berlin', 'Seoul'}
```

### **IV.** difference() and difference\_update()

The difference() and difference\_update() methods prints only items that are only present in the original set and not in both the sets. The difference() method returns a new set whereas difference\_update() method updates into the existing set from another set.

#### Example

```python
cities = {"Tokyo", "Madrid", "Berlin", "Delhi"}
cities2 = {"Seoul", "Kabul", "Delhi"}
cities3 = cities.difference(cities2)
print(cities3)
```

#### Output

```python
{'Tokyo', 'Madrid', 'Berlin'}
```

#### Example

```python
cities = {"Tokyo", "Madrid", "Berlin", "Delhi"}
cities2 = {"Seoul", "Kabul", "Delhi"}
print(cities.difference(cities2))
```

#### Output

```python
{'Tokyo', 'Berlin', 'Madrid'}
```

## Conclusion

Thanks for reading this blog!! I hope you have learnt something new today and I wish you an amazing day ahead ❤

![](https://images.pexels.com/photos/2072165/pexels-photo-2072165.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1 align="center")
