# AEP


AE工作流套装，包含输出部分，运行部分。  
用于3D时间线动画控制，更高效的制作Interactive 3d motion graphic.  
AEP = 复杂的3d mg线性动画 + 灵活的程序控制  
  
demo地址:(建议手机浏览)  
https://shrek.imdevsh.com/demo/aep/aep&bokeh.html  
(该案例展示了一些常规用法，变速播放，倒放，左右摇摆手机以及点击其中一些圆形小元素都有交互反应等)  

https://shrek.imdevsh.com/show/msg2018/  
(该案例展示了使用ae面片搭建大型场景的可能)  

https://shrek.imdevsh.com/show/baibaoshu/  
(该案例展示了多场景素材组合)  

https://shrek.imdevsh.com/show/tmall/  
(天猫邀请函，该案例非aep制作，不过是此项目的启发点，留档查看用)  

除了以上演示，还有长时间轴拖放控制等都可以轻松实现，相比视频或者flash 2d动画，3d mg在维度上给了动画更多表现空间，交互上多了更多玩法。制作上，让动画和程序可以分拆并让各自发挥最大效能，显著提高了制作效率和质量。  


以上demo是集合了VML的创意，动画，开发多方成员的共同努力成果。不涉及品牌，仅供查看，侵删  


有3d问题欢迎加入研讨。QQ群:572807793（webgl技术交流）  


# 使用方法

aexporter.jsx 放入AE安装根目录Scripts文件夹下，然后在ae命令中就会多一个aexporter命令了，打开需要导出的场景，然后运行命令即可，命令会把当前场景的图片素材和场景信息json导出到当前打开工程文件的目录下。

player.js 播放器，使用方法可以参考在线demo: https://shrek.imdevsh.com/demo/aep/aep&bokeh.html


# API

全局静态方法： 
```js
AEP.loadQueue(source:array, progress:function, complete:function);
```
source是包含json和图片地址数组
```js
AEP.loadFullJson(json:string, base:string, progress:function, complete:function, percent:number);
```
json是动画json文件地址，base是素材所在相对目录地址，最后的percent是加载素材比例，不用全部加载，一般预载第一个画面需要使用的图片量就够了，后面会在进入场景后自动加载完成。
以上是两个预加载素材的方法，需要至少预载了json后再实例化AEP.Tanimation使用

全局属性： 
```js
AEP.global.loadOrder = 0; //0为默认值顺序加载json中的素材图片，1为逆向加载
AEP.global.alphaTest = 0.05; //THREE中的alphaTest
AEP.global.lockWidth = false; //是否锁定场景宽度
AEP.global.far = 0; //camera远点
AEP.global.near = 0; //camera近点
AEP.global.width = 0; //场景宽度
AEP.global.height = 0; //场景高度
```

**AEP.Tanimation**  
核心类，实例化后使用：  
```js
var anim = new AEP.Tanimation(data['data.json'], {
    path: '', //素材包相对地址，用于自动加载图片素材时获取到正确地址
    assets: data, //已加载的图片素材数据
    loop: true, //动画是否首尾循环
    onStart: function () {}, //动画启动时触发
    onEnd: function () {}, //动画结束时触发
    onUpdate: function (delta) {} //动画更新时触发
});

anim.setSize(width:number, height:number); //设置场景宽高
anim.setFrameRate(fps:number); //设置每秒帧数fps
anim.getFrameRate(); //获取fps
anim.seek(time:number); //去往time(毫秒数)时间点
anim.prev(); //去往前一帧
anim.next(); //去往后一帧
anim.play(); //动画播放
anim.pause(); //动画暂停
anim.stop(); //动画停止，当前时间回到0
anim.reverse(); //动画倒放

anim.solo(items:array|item); //设置自循环动画
anim.playSolo(); //播放自循环动画
anim.pauseSolo(); //暂停自循环动画

anim.findByName(name:string); //查找名称为name的所有元素
anim.findContainName(name:string); //查找名称包含name的所有元素
anim.findByRef(name:string); //查找素材名为name的所有元素
anim.findContainRef(name:string); //查找素材名包含name的所有元素

anim.totalTime //动画总毫秒数
anim.curTime //当前毫秒数
anim.timeScale //时间缩放比例
```

# License
This content is released under the [MIT](http://opensource.org/licenses/MIT) License.