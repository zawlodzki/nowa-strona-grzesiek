import ctypes,time
x=ctypes.CDLL('libX11.so.6'); t=ctypes.CDLL('libXtst.so.6')
x.XOpenDisplay.restype=ctypes.c_void_p
x.XKeysymToKeycode.argtypes=[ctypes.c_void_p,ctypes.c_ulong];x.XKeysymToKeycode.restype=ctypes.c_uint
x.XStringToKeysym.argtypes=[ctypes.c_char_p];x.XStringToKeysym.restype=ctypes.c_ulong
t.XTestFakeKeyEvent.argtypes=[ctypes.c_void_p,ctypes.c_uint,ctypes.c_int,ctypes.c_ulong];x.XFlush.argtypes=[ctypes.c_void_p]
d=x.XOpenDisplay(b':119')
def key(s,down): t.XTestFakeKeyEvent(d,x.XKeysymToKeycode(d,x.XStringToKeysym(s.encode())),down,0);x.XFlush(d)
key('Control_L',1);key('f',1);key('f',0);key('Control_L',0);time.sleep(.3)
key('Control_L',1);key('a',1);key('a',0);key('Control_L',0)
for c in 'kwalifikacja siedzi':
 k='space' if c==' ' else c
 key(k,1);key(k,0);time.sleep(.03)
time.sleep(1)
