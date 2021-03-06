
#include <stdio.h>
#include <stdlib.h>
#include <stdint.h>
#include <string.h>
#include "read2.h"
#include <math.h>
#define sr 48000
#include <unistd.h>
int readsf(FILE *fd)
{
	header_t *header = (header_t *)malloc(sizeof(header_t));
	header2_t *h2 = (header2_t *)malloc(sizeof(header2_t));
	fread(header, sizeof(header_t), 1, fd);

	printf("%.4s %.4s %.4s %u\n", header->name, header->sfbk, header->list, header->size);
	fread(h2, sizeof(header2_t), 1, fd);
	printf("\n%.4s %u", h2->name, h2->size);
	info = malloc(h2->size);
	fread(info, h2->size, 1, fd);
	fread(h2, sizeof(header2_t), 1, fd);
	printf("\n%.4s %u", h2->name, h2->size);
	data = (short *)malloc(h2->size * sizeof(short));
	sdta = (float *)malloc(h2->size * sizeof(float));
	float *trace = sdta;
	nsamples = h2->size / sizeof(short);

	printf("\n\t %ld", ftell(fd));
	fread(data, sizeof(short), nsamples, fd);

	for (int i = 0; i < nsamples; i++)
	{
		*trace++ = *(data + i) / 32767.0f;
	}
	//free(data);

#define readSection(section)                  \
	fread(sh, sizeof(section_header), 1, fd);   \
	printf("%.4s:%u\n", sh->name, sh->size);    \
	n##section##s = sh->size / sizeof(section); \
	section##s = (section *)malloc(sh->size);   \
	fread(section##s, sizeof(section), sh->size / sizeof(section), fd);

	section_header *sh = (section_header *)malloc(sizeof(section_header));

	fread(h2, sizeof(header2_t), 1, fd);
	printf("\n%.4s %u \n", h2->name, h2->size);

	readSection(phdr);
	readSection(pbag);
	readSection(pmod);
	readSection(pgen);
	readSection(inst);
	readSection(ibag);
	readSection(imod);
	readSection(igen);
	readSection(shdr);
	return 1;
}

zone_t *index22(int pid, int bkid, int key, int vel)
{
	zone_t *z1, z2;
	int found = 0;
	short igset[60] = {-1};
	int instID = -1;
	int lastSampId = -1;
	short pgdef[60] = {-1};
	for (int i = 0; i < nphdrs - 1; i++)
	{
		if (phdrs[i].bankId != bkid || phdrs[i].pid != pid)
			continue;
		int lastbag = phdrs[i + 1].pbagNdx;

		for (int j = phdrs[i].pbagNdx; j < lastbag; j++)
		{
			pbag *pg = pbags + j;
			pgen_t *lastg = pgens + pg[j + 1].pgen_id;
			int pgenId = pg->pgen_id;
			int lastPgenId = j < npbags - 1 ? pbags[j + 1].pgen_id : npgens - 1;
			short pgset[60] = {-1};
			instID = -1;
			for (int k = pgenId; k < lastPgenId; k++)
			{
				pgen_t *g = pgens + k;
				if (g->operator== 48)
					printf("atten %hd f", g->val.shAmount);
				if (g->operator== 44 &&(g->val.ranges.lo > vel || g->val.ranges.hi < vel))
					break;
				if (g->operator== 43 &&(g->val.ranges.lo > key || g->val.ranges.hi < key))
					break;
				if (g->operator== 41)
				{
					instID = g->val.shAmount;
				}
				pgset[g->operator] = g->val.shAmount;
			}
			if (instID == -1)
			{
				memcpy(pgdef, pgset, sizeof(pgset));
			}
			else
			{
				inst *ihead = insts + instID;
				int ibgId = ihead->ibagNdx;
				int lastibg = (ihead + 1)->ibagNdx;
				lastSampId = -1;
				short igdef[60] = {-1};
				for (int ibg = ibgId; ibg < lastibg; ibg++)
				{
					short igset[60];
					ibag *ibgg = ibags + ibg;
					pgen_t *lastig = ibg < nibags - 1 ? igens + (ibgg + 1)->igen_id : igens + nigens - 1;
					for (pgen_t *g = igens + ibgg->igen_id; g->operator!= 60 && g != lastig; g++)
					{
						if (g->operator== 48)
							printf("atten %hu", g->val.shAmount);
						if (g->operator== 44 &&(g->val.ranges.lo > vel || g->val.ranges.hi < vel))
							break;
						if (g->operator== 43 &&(g->val.ranges.lo > key || g->val.ranges.hi < key))
							break;

						igset[g->operator]=g->val.shAmount;
						if (g->operator== 53)
						{
							lastSampId = g->val.shAmount; // | (ig->val.ranges.hi << 8);
							short *attributes = (short *)malloc(sizeof(short) * 60);
							for (int i = 0; i < 60; i++)
							{
								if (igset[i])
									*(attributes + i) = igset[i];
								else if (igdef[i])
									*(attributes + i) = igset[i];

								if (pgset[i])
									*(attributes + i) += pgset[i];
								else if (pgdef[i])
									*(attributes + i) += pgdef[i];
							}
							zone_t *z;
							if (z1 != NULL)
								z = &z2;
							else
								z = &z1;

							// z = (zone_t *)malloc(sizeof(zone_t));
							memcpy(z, attributes, 60 * sizeof(short));

							//		printf("\n samp%d", lastSampId);
							shdrcast *sh = (shdrcast *)(shdrs + lastSampId);
							z->sample = sh;

							z->start = sh->start + ((unsigned short)(z->StartAddrCoarseOfs & 0x7f) << 15) + (unsigned short)(z->StartAddrOfs & 0x7f);
							z->end = sh->end + ((unsigned short)(z->EndAddrCoarseOfs & 0x7f) << 15) + (unsigned short)(z->EndAddrOfs & 0x7f);
							z->endloop = sh->endloop + ((unsigned short)(z->EndLoopAddrCoarseOfs & 0x7f) << 15) + (unsigned short)(z->EndLoopAddrOfs & 0x7f);
							z->startloop = sh->startloop + (unsigned short)(z->StartLoopAddrCoarseOfs & 0x7f << 15) + (unsigned short)(z->StartLoopAddrOfs & 0x7f);

							return z;
						}
					}
				}
			}
		}
	}
	return 'g';
}

static float p2over1200LUT[1200];
static inline float p2over1200(float x)
{
	if (x < -12000)
		return 0;
	if (x < 0)
		return 1.f / p2over1200(-x);
	else if (x > 1200.0f)
	{
		return 2 * p2over1200(x - 1200.0f);
	}
	else
	{
		return p2over1200LUT[(unsigned short)(x)];
	}
}
static float centdbLUT[960];
static float centdblut(int x)
{
	if (x < 0)
		x = 0;
	if (x > 960)
		x = 960;

	return centdbLUT[x];
}
void initLUTs()
{
	for (int i = 0; i < 2400; i++)
	{
		p2over1200LUT[i] = powf(2.0f, i / 1200.0f);
	}
	for (int i = 0; i < 960; i++)
	{
		centdbLUT[i] = powf(10.0f, i / -200.0);
	}
}

adsr_t *newEnvelope(short centAtt, short centRelease, short centDecay, short sustain, int sampleRate)
{
	adsr_t *env = (adsr_t *)malloc(sizeof(adsr_t));
	env->att_steps = fmax(p2over1200(centAtt) * sampleRate, 2);
	env->decay_steps = fmax(p2over1200(centDecay) * sampleRate, 2);
	env->release_steps = fmax(p2over1200(centRelease) * sampleRate, 2);
	env->att_rate = -960.0f / env->att_steps;
	env->decay_rate = ((float)1.0f * sustain) / (env->decay_steps);
	env->release_rate = (float)(1000) / (env->release_steps);
	env->db_attenuate = 960.0f;
	return env;
}
float envShift(adsr_t *env)
{
	if (env->att_steps > 0)
	{
		env->att_steps--;
		env->db_attenuate += env->att_rate;
	}
	else if (env->decay_steps > 0)
	{
		env->decay_steps--;
		env->db_attenuate += env->decay_rate;
	}
	else if (env->release_steps > 0)
	{
		env->release_steps--;
		env->db_attenuate += env->release_rate;
	}
	if (env->db_attenuate > 960)
	{
		env->db_attenuate = 960.0f;
	}
	if (env->db_attenuate < 0.0)
	{
		env->db_attenuate = 0.0f;
	}
	return env->db_attenuate;
}
void adsrRelease(adsr_t *env)
{
	env->decay_steps = 0;
	env->att_steps = 0;
}

voice *newVoice(zone_t *z, int key, int vel)
{

	voice *v = (voice *)malloc(sizeof(voice));
	v->ampvol = newEnvelope(z->VolEnvAttack, z->VolEnvRelease, z->VolEnvDecay, z->VolEnvSustain, 48000);
	short rt = z->OverrideRootKey > -1 ? z->sample->originalPitch : z->sample->originalPitch;
	float sampleTone = rt * 100.0f + z->CoarseTune * 100.0f + (float)z->FineTune;
	float octaveDivv = ((float)key * 100 - sampleTone) / 1200.0f;
	v->ratio = 1.0f * pow(2.0f, octaveDivv) * z->sample->sampleRate / 48000;

	v->pos = z->sample->start;
	v->frac = 0.0f;
	v->z = z;
	v->midi = key;
	v->velocity = vel;

	return v;
}
typedef struct _channel
{
	voice *voice;
	int program_number;
	float midi_gain_cb;
	float midi_pan;
} channel_t;
typedef struct
{
	int sampleRate;
	int currentFrame_start;
	int samples_per_frame;
	channel_t *channels;
} ctx_t;

static float outputLeft[128];
static float outputRight[128];
static float outputInterweaved[128 * 2];

ctx_t *ctx;
void loop(voice *v, channel_t *ch)
{
	uint32_t loopLength = v->z->sample->endloop - v->z->sample->startloop;
	int cb_attentuate = v->z->Attenuation; // - ch->midi_gain_cb;
	uint16_t pan = ch->midi_pan > 0 ? ch->midi_pan * 960 / 127 : v->z->Pan;
	float panLeft = sqrtf(.5 + pan / 1000);
	float panright = sqrtf(.5 - pan / 1000);
	for (int i = 0; i < 128; i++)
	{
		float f1 = *(sdta + v->pos);
		float f2 = *(sdta + v->pos + 1);
		float gain = f1 + (f2 - f1) * v->frac;
		float tt = envShift(v->ampvol); // + cb_attentuate;
		//	printf("\n atten %d f", tt);

		float mono = gain * centdblut(tt); //[(int)envShift(v->ampvol)]; //* centdbLUT[v->z->Attenuation];
		outputInterweaved[2 * i] += mono * panLeft;
		outputInterweaved[2 * i + 1] += mono * panright; //(1 - pan / 1000);
		v->frac += v->ratio;
		while (v->frac >= 1.0f)
		{
			v->frac--;
			v->pos++;
		}
		if (v->pos >= v->z->sample->endloop)
		{
			v->pos = v->pos - loopLength;
		}
	}
}
void render(int frames, FILE *output)
{
	while (frames >= 0)
	{
		bzero(outputInterweaved, sizeof(float) * ctx->samples_per_frame);
		for (int ch = 0; ch < 16; ch++)
		{
			voice *v = (ctx->channels + ch)->voice;
			if (v->midi > 0)
			{
				loop(v, ctx->channels + ch);
			}
		}
		frames -= 128;
		fwrite(outputInterweaved, 128, 4, output);
	}
}
void noteOn(int channelNumber, int midi, int vel)
{
	int programNumber = (ctx->channels + channelNumber)->program_number;
	zone_t *z = index22(programNumber & 0x7f, programNumber & 0x80, midi, vel);

	(ctx->channels + channelNumber)->voice = newVoice(z, midi, vel);
}
void noteOff(int channelNumber, int midi)
{
	voice *v = (ctx->channels + channelNumber)->voice;
	adsrRelease(v->ampvol);
}

void init_ctx()
{
	ctx = (ctx_t *)malloc(sizeof(ctx_t));
	ctx->sampleRate = 48000;
	ctx->currentFrame_start = 0;
	ctx->samples_per_frame = 128 * 2;
	ctx->channels = (channel_t *)malloc(sizeof(channel_t) * 16);
	for (int i = 0; i < 16; i++)
	{
		(ctx->channels + i)->program_number = 0;
		(ctx->channels + i)->midi_pan = 1.f;
		(ctx->channels + i)->midi_gain_cb = 89.0f;
		(ctx->channels + i)->voice = (voice *)malloc(sizeof(voice));
	}
}
int mkfifo(char *sf);
int main()
{

	//	FILE *dl = popen("curl -s 'https://www.grepawk.com/static/Timpani-20201121.sf2' -o -", "r");
	FILE *dl = fopen("file.sf2", "rb");
	readsf(dl);
	fclose(dl);
	for (int i = 0; i < nphdrs; i++)
		printf("\n %d %s %d", i, phdrs[i].name, phdrs[i].pid);

	//FILE *proc = popen("ffmpeg -y -f f32le -i pipe:0 -ac 2 -ar 48000 -f flac ggg.flac", "w");
	FILE *proc = popen("ffplay -f f32le -ac 2 -ar 48000 -i pipe:0", "w");

	init_ctx();
	initLUTs();
	(ctx->channels + 0)->program_number = 13;
	(ctx->channels + 1)->program_number = 33;
	(ctx->channels + 2)->program_number = 60;

	int v = 0, dv = 1;
	while (v < 45)
	{
		int _v = v;
		for (int i = 0; i < 8; i++)
		{

			noteOn(i, 33 + v, v * 3);
			render(1280, proc);
			noteOn(i, 37 + v, v * 6);
			render(12000, proc);
			noteOn(i, 40 + v, v * 4);
		}
		render(24000, proc);

		noteOff(0, 33 + v);
		noteOff(1, 37 + v);
		noteOff(2, 40 + v);
		render(24000, proc);
		//	usleep(1e6 / 2);
		v = v + dv;
		if (v > 10)
			dv = -2;
	}

	pclose(proc);

	return 0;
}