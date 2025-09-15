# krpano街景漫游与平面地图结合方案

这是一个详细的、分步的实现方案，用于将您的krpano街景漫游与一个自定义的平面地图结合起来，实现位置同步功能。所有操作将通过编辑 `tour.xml` 文件来完成。

---

### **方案概述**

我们将实现以下核心逻辑：

1.  **添加地图**：将您的平面地图作为-一个固定的图层显示在屏幕角落。
2.  **添加标记**：在地图上再叠加一个“您当前所在位置”的小图标（标记）。
3.  **关联坐标**：为每一个全景图（即“地点”或“场景”）设置它在平面地图上的 `X` 和 `Y` 坐标。
4.  **动态更新**：创建一个自动化动作，当您切换到新的全景图时，该动作会自动读取新地点的坐标，并立刻将位置标记移动到地图上的新位置。

---

### **详细实施计划**

#### **第一步：准备工作 (需要您完成)**

1.  **准备地图图片**：
    *   请将您的地图图片（无论是 `.tiff`, `.png` 还是 `.jpg`）**转换为Web兼容的 `.png` 或 `.jpg` 格式**。这是为了确保所有用户的浏览器都能正确显示它。`.png` 是首选格式。
    *   将转换后的地图文件（例如，命名为 `mymap.png`）放置到项目的 `integration/vtour/skin/` 目录下。

2.  **获取每个地点的坐标**：
    *   使用图像编辑软件（如Photoshop, GIMP, Paint.NET等）打开您刚刚准备好的 `mymap.png` 文件。
    *   对于您漫游中的 **每一个全景图（场景）**，在地图上找到它所对应的准确位置。
    *   记录下该位置的 **像素坐标 (X, Y)**。建议在一个文本文件中清晰地记下，格式如下，以便后续使用：
        ```
        # 格式: 场景名称, X坐标, Y坐标
        scene_IMG_20250829_194216_00_481, 150, 230
        scene_IMG_20250829_194245_00_482, 185, 310
        # ...为所有场景记录坐标
        ```

---

#### **第二步：修改 `tour.xml` - 添加地图和位置标记**

需要打开 `integration/vtour/tour.xml` 文件，并在 `<krpano>` 标签内（通常建议放在现有 `<layer>` 元素的末尾）添加以下XML代码来创建地图界面。

```xml
<!-- 自定义地图系统 -->
<layer name="map_container" keep="true" type="container" align="leftbottom" x="20" y="20" width="300" height="250" bgcolor="0x000000" bgalpha="0.5" border="1,0xFFFFFF,0.5">

    <!-- 加载您的地图图片 -->
    <!-- 注意: url中的路径要与您第一步中放置的文件名一致 -->
    <layer name="map_image" url="skin/mymap.png" align="lefttop" />

    <!-- 添加位置标记 (这里使用krpano自带的红色圆点图标) -->
    <layer name="map_spot" url="skin/vtourskin_mapspot.png" align="lefttop" parent="map_container" x="0" y="0" visible="false" />

</layer>
```
*   **`map_container`**: 这是地图的容器。您可以根据需要调整 `align`, `x`, `y` (位置), `width`, `height` (大小), `bgcolor` (背景色), `bgalpha` (背景透明度) 和 `border` (边框) 等属性。
*   **`map_image`**: 这里会加载您在第一步中准备的 `mymap.png` 文件。
*   **`map_spot`**: 这是位置标记，初始时 `visible="false"` 将其隐藏，直到场景加载完成。

---

#### **第三步：修改 `tour.xml` - 为每个场景添加坐标数据**

将第一步中记录的坐标数据添加到 `tour.xml` 中对应的 `<scene>` 标签里。您需要为 **每一个** 希望在地图上定位的场景添加 `map_x` 和 `map_y` 这两个自定义属性。

**示例:**
```xml
<!-- 修改前的场景定义 -->
<scene name="scene_IMG_20250829_194216_00_481" title="地点A" ...>
    ...
</scene>

<!-- 修改后的场景定义 (添加了自定义坐标属性) -->
<scene name="scene_IMG_20250829_194216_00_481" title="地点A" ... map_x="150" map_y="230">
    ...
</scene>
```

---

#### **第四步：修改 `tour.xml` - 创建自动更新的逻辑**

这是最关键的一步，用于实现位置标记的自动化更新。在 `tour.xml` 文件的 `<krpano>` 标签内（通常建议放在所有 `<scene>` 定义之后），添加或修改 `<events>` 和 `<action>` 标签。

```xml
<!-- 定义一个全局事件，在每次加载新场景(pano)时，都调用我们的更新动作 -->
<events onnewpano="update_map_spot_position();" />

<!-- 定义更新动作的具体逻辑 -->
<action name="update_map_spot_position">
    <!--
      检查当前加载的场景(xml.scene)是否定义了 'map_x' 属性。
      这是一个 if...then...else 结构。
    -->
    if(scene[get(xml.scene)].map_x,

        <!-- 条件为真 (定义了坐标): -->
        <!-- 1. 获取坐标值并更新 'map_spot' 图层的位置 -->
        set(layer[map_spot].x, get(scene[get(xml.scene)].map_x));
        set(layer[map_spot].y, get(scene[get(xml.scene)].map_y));

        <!-- 2. 让 'map_spot' 图层变得可见 -->
        set(layer[map_spot].visible, true);
      ,
        <!-- 条件为假 (没有定义坐标): -->
        <!-- 隐藏 'map_spot' 图层 -->
        set(layer[map_spot].visible, false);
    );
</action>
```

*   **`<events onnewpano="...">`**: `onnewpano` 是krpano的一个核心内置事件，每次成功加载并切换到一个新场景后，它就会被触发。
*   **`<action name="...">`**: 这里定义了我们的核心自动化逻辑。它会智能地检查新场景是否有坐标，如果有，就移动标记并显示它；如果这个场景没有设置坐标，标记就会被自动隐藏。

---

### **总结**

按照以上四个步骤操作，您就可以成功地为您的krpano全景漫游添加一个功能完善、可实时同步位置的平面小地图。
